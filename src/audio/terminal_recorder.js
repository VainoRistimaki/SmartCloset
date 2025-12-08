// rec-toggle-space.js
// Node 23+ script — press SPACE to start recording, press SPACE again to stop and save MP3.
// On macOS (darwin) this defaults to AVFoundation audio device :1. Override with DEVICE env var.

import { spawn } from "node:child_process";
import readline from "node:readline";
import os from "node:os";
import path from "node:path";

let ffmpegProc = null;
let recording = false;

function timestampFilename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const name = `my_recording.mp3`;
  return path.join(process.cwd(), name);
}

/**
 * Build ffmpeg args by platform.
 * You can override DEVICE env var to specify device name/index.
 */
function buildFfmpegArgs(outputPath) {
  const platform = os.platform();
  const deviceEnv = process.env.DEVICE || ''; // optional override

  // common encoding args: 44.1kHz stereo, libmp3lame
  const common = ['-y', '-acodec', 'libmp3lame', '-ar', '44100', '-ac', '2'];

  if (platform === 'darwin') {
    // macOS avfoundation: audio device index after colon. Default ":1".
    // To list devices: run `ffmpeg -f avfoundation -list_devices true -i ""`
    // If DEVICE is set, use that (e.g. DEVICE="0" or DEVICE="1" or DEVICE="2").
    const devIndex = deviceEnv || '0';
    const avInput = `:${devIndex}`;
    return ['-f', 'avfoundation', '-i', avInput, ...common, outputPath];
  } else if (platform === 'linux') {
    // Linux: try PulseAudio default
    // If you need a specific Pulse device, set DEVICE (e.g. "alsa_output.pci-0000_00_1b.0.analog-stereo.monitor")
    const dev = deviceEnv || 'default';
    return ['-f', 'pulse', '-i', dev, ...common, outputPath];
  } else if (platform === 'win32') {
    // Windows DirectShow: device name must be exact (use ffmpeg -list_devices true -f dshow -i dummy to list)
    // Example: DEVICE="audio=Microphone (Realtek(R) Audio)"
    const dev = deviceEnv || 'audio=Microphone';
    return ['-f', 'dshow', '-i', dev, ...common, outputPath];
  } else {
    // Generic fallback: try default ALSA / pulse
    return ['-f', 'pulse', '-i', deviceEnv || 'default', ...common, outputPath];
  }
}

function startRecording() {
  if (recording) return;
  const out = timestampFilename();
  const args = buildFfmpegArgs(out);

  console.log('Starting recording →', out);
  console.log('ffmpeg args:', args.join(' '));

  // spawn ffmpeg
  ffmpegProc = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

  ffmpegProc.on('error', (err) => {
    console.error('Failed to start ffmpeg. Make sure ffmpeg is installed and in your PATH.');
    console.error(err);
    ffmpegProc = null;
    recording = false;
  });

  ffmpegProc.on('exit', (code, signal) => {
    if (code === 0) {
      console.log('Recording saved:', out);
    } else {
      console.log(`ffmpeg exited with code ${code} signal ${signal}`);
    }
    ffmpegProc = null;
    recording = false;
  });

  recording = true;
}

function stopRecording() {
  if (!recording || !ffmpegProc) return;
  console.log('Stopping recording...');
  // Ask ffmpeg to quit gracefully by sending 'q' to its stdin (preferred)
  try {
    ffmpegProc.stdin.write('q');
    // if that fails, fallback to kill after a short timeout
    setTimeout(() => {
      if (ffmpegProc) {
        ffmpegProc.kill('SIGINT');
      }
    }, 1500);
  } catch (e) {
    try { ffmpegProc.kill('SIGINT'); } catch (_e) {}
  }
}

// Setup stdin keypress handling
/*
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

console.log('Press SPACE to start/stop recording. Press Ctrl+C to exit.');

process.stdin.on('keypress', (str, key) => {
  // key.sequence might be ' ' for space
  if (key && key.name === 'space') {
    if (!recording) startRecording();
    else stopRecording();
    return;
  }

  // exit on ctrl+c or ctrl+d
  if ((key && key.ctrl && key.name === 'c') || key.sequence === '\u0004') {
    if (recording) {
      console.log('Stopping active recording before exit...');
      stopRecording();
      // wait a little for ffmpeg to exit
      setTimeout(() => process.exit(0), 1000);
    } else {
      process.exit(0);
    }
  }
});


// also handle process signals
process.on('SIGINT', () => {
  console.log('\nSIGINT received.');
  if (recording) stopRecording();
  setTimeout(() => process.exit(0), 500);
});

*/


export {startRecording, stopRecording};