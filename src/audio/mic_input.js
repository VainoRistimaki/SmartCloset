let audioContext = null;
let processorNode = null;
let sourceNode = null;
let monitorNode = null;
let audioChunks = [];
let micStream = null;
let audioSampleRate = 44100;
let currentAudioURL = null;
let isRecording = false;
let targetDirectoryHandle = null;

const MP3_FILENAME = 'my_record.mp3';
const PREFERRED_DIRECTORY = '/Documents/emilia/KAISTkurssit/DAI/SmartCloset';

const startButton  = document.getElementById('startButton');
const stopButton   = document.getElementById('stopButton');
const dirButton    = document.getElementById('dirButton');
const audioElement = document.getElementById('audioElement');
const statusText   = document.getElementById('statusText');
const downloadLink = document.getElementById('downloadLink');
const dirStatus    = document.getElementById('dirStatus');

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
dirButton.addEventListener('click', selectDirectoryForSaving);

// ----- Start recording -----
async function startRecording() {
  if (isRecording) return;

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();

    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioSampleRate = audioContext.sampleRate;
    audioChunks = [];

    sourceNode = audioContext.createMediaStreamSource(micStream);
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    processorNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      audioChunks.push(new Float32Array(inputData));
    };

    sourceNode.connect(processorNode);

    monitorNode = audioContext.createGain();
    monitorNode.gain.value = 0;
    processorNode.connect(monitorNode);
    monitorNode.connect(audioContext.destination);

    startButton.disabled = true;
    stopButton.disabled = false;
    downloadLink.classList.add('hidden');
    revokeAudioURL();
    updateStatus('Recording...');
    isRecording = true;
  } catch (error) {
    console.error('Microphone access error:', error);
    updateStatus('Please check microphone permissions.');
    await cleanupAudioGraph();
    startButton.disabled = false;
    stopButton.disabled = true;
  }
}

// ----- Stop recording + save MP3 -----
async function stopRecording() {
  if (!isRecording) return;

  const recordedChunks = audioChunks;
  audioChunks = [];
  await cleanupAudioGraph();
  isRecording = false;

  const bufferLength = recordedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  if (bufferLength === 0) {
    updateStatus('No audio was captured. Please try again.');
    startButton.disabled = false;
    stopButton.disabled = true;
    return;
  }

  updateStatus('Converting to MP3...');
  let mp3Blob;
  try {
    const mergedBuffer = mergeFloat32Arrays(recordedChunks, bufferLength);
    mp3Blob = encodeMp3(mergedBuffer, audioSampleRate);
  } catch (error) {
    console.error('MP3 encoding failed:', error);
    updateStatus('Failed to encode MP3. Check the console for details.');
    startButton.disabled = false;
    stopButton.disabled = true;
    return;
  }

  currentAudioURL = URL.createObjectURL(mp3Blob);
  audioElement.src = currentAudioURL;
  audioElement.play().catch(() => {
    // If autoplay fails, let the user click the button.
  });

  downloadLink.href = currentAudioURL;
  downloadLink.classList.remove('hidden');
  downloadLink.download = MP3_FILENAME;
  downloadLink.textContent = `Save ${MP3_FILENAME} again`;

  startButton.disabled = false;
  stopButton.disabled = true;

  await saveMp3File(mp3Blob);
}

async function cleanupAudioGraph() {
  if (processorNode) {
    processorNode.disconnect();
    processorNode.onaudioprocess = null;
    processorNode = null;
  }

  if (monitorNode) {
    monitorNode.disconnect();
    monitorNode = null;
  }

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  if (audioContext) {
    try {
      await audioContext.close();
    } catch (err) {
      console.warn('AudioContext close error:', err);
    }
    audioContext = null;
  }
}

function mergeFloat32Arrays(chunks, totalLength) {
  const result = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function encodeMp3(samples, sampleRate) {
  if (!window.lamejs) {
    throw new Error('The lamejs library was not loaded.');
  }

  const Mp3Encoder = window.lamejs.Mp3Encoder;
  const mp3Encoder = new Mp3Encoder(1, sampleRate, 128);
  const sampleBlockSize = 1152;
  const mp3Data = [];

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const int16Buffer = floatTo16BitPCM(sampleChunk);
    const encoded = mp3Encoder.encodeBuffer(int16Buffer);
    if (encoded.length > 0) {
      mp3Data.push(encoded);
    }
  }

  const end = mp3Encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  return new Blob(mp3Data, { type: 'audio/mpeg' });
}

function floatTo16BitPCM(floatSamples) {
  const buffer = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return buffer;
}

async function selectDirectoryForSaving() {
  if (!window.showDirectoryPicker) {
    updateDirStatus('This browser does not support choosing directories.', true);
    return;
  }

  try {
    const handle = await window.showDirectoryPicker();
    const hasPermission = await verifyDirPermission(handle);
    if (!hasPermission) {
      updateDirStatus('Folder permission is required to save.', true);
      return;
    }

    targetDirectoryHandle = handle;
    updateDirStatus(`Selected folder: ${handle.name} (Choose C:\\dev\\SmartCloset to save automatically.)`);
  } catch (error) {
    if (error.name === 'AbortError') {
      updateDirStatus('Folder selection was canceled.', true);
      return;
    }
    console.error('Folder selection failed:', error);
    updateDirStatus('An error occurred while selecting the folder.', true);
  }
}

async function verifyDirPermission(handle) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission?.(opts)) === 'granted') {
    return true;
  }
  if (handle.requestPermission) {
    return (await handle.requestPermission(opts)) === 'granted';
  }
  return false;
}

async function writeFileToDirectory(directoryHandle, blob) {
  const fileHandle = await directoryHandle.getFileHandle(MP3_FILENAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveMp3File(blob) {
  if (targetDirectoryHandle) {
    try {
      const allowed = await verifyDirPermission(targetDirectoryHandle);
      if (allowed) {
        await writeFileToDirectory(targetDirectoryHandle, blob);
        updateStatus(`${MP3_FILENAME} was saved to the selected folder (C:\\dev\\SmartCloset recommended).`);
        return;
      }
    } catch (error) {
      console.error('Failed to save to the chosen folder:', error);
      updateStatus('Could not save to the selected folder. Falling back to the file picker.');
    }
  }

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: MP3_FILENAME,
        types: [
          {
            description: 'MP3 Audio',
            accept: { 'audio/mpeg': ['.mp3'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      updateStatus(`${MP3_FILENAME} has been saved.`);
      return;
    } catch (error) {
      if (error.name === 'AbortError') {
        updateStatus('File save was canceled. You can download directly via the link.');
        return;
      }
      console.error('File save failed:', error);
    }
  }

  triggerDownload(blob);
  updateStatus(`${MP3_FILENAME} was downloaded.`);
}

function triggerDownload(blob) {
  const tempURL = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = tempURL;
  anchor.download = MP3_FILENAME;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(tempURL), 2000);
}

function revokeAudioURL() {
  if (currentAudioURL) {
    URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = null;
  }
}

function updateStatus(message) {
  statusText.textContent = message;
}

function updateDirStatus(message, isError = false) {
  dirStatus.textContent = `${message} (Recommended path: ${PREFERRED_DIRECTORY})`;
  dirStatus.style.color = isError ? '#c0392b' : '#555';
}

updateDirStatus('Select the C:\\dev\\SmartCloset directory in your browser to save automatically.');

window.addEventListener('beforeunload', revokeAudioURL);
