import five from 'johnny-five';
const { Boards, Led, Pin, Button } = five;

import EventEmitter from 'events';
const emitter = new EventEmitter();

import {getClothesObject} from '../dataLoader/clothesDataLoader.js';

const hangers = await getClothesObject();

let recording = false;

function toggleRecording() {
    recording = !recording
    emitter.emit("recording-changed", recording);
}

//console.log(hangers);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postData(data) {

    console.log("Sending data to server: ", data   )
    const response = await fetch('http://localhost:3000', {
        method: 'POST',
        headers: {
        'content-type': 'application/json',
        },
        body: JSON.stringify({
            hangers: data
        }),
    });
}



class Arduino {

    //readPins = []

    constructor(id, board) {
        this.id = id;
        this.board = board;
        this.ready = false;
        this.readPins = []
        this.writePins = [3, 5, 6, 9, 10];
        this.hangers = [null, null, null, null, null];
        this.oldHangers = null;
        this.resistor = 220

        this.pinsResistances = [0, 0, 0, 0, 0];
        this.lightStatus = [0, 0, 0, 0, 0];
        this.pinsResistances = [0, 0, 0, 0, 0];
        this.lightStatus = [0, 0, 0, 0, 0];

        
        //this.initialize();
        
    }

    initialize() {

            // Initialize analog read pins A0 to A5
        for (let i = 0; i < 5; i++) {
            this.readPins.push(new Pin({pin: "A" + i, board: this.board}))
        };
        //console.log("Hello")
        // Initialize write pins 3,5,6,9,10,11
        this.writePins = this.writePins.map(pinNum => new Pin({pin: pinNum, board: this.board}));
        // Set the board as ready
        this.ready = true;
            /*
            // Check pins every second
            setInterval(async () => {
                await this.checkPins();
            }, 8000);
            */
           //this.pollingLoop();

           //this.lightManyHangers([8]);
    }
        

    // Check a specific pin
    async checkPin(id) {
        if (this.ready) {
            // Query the pin for its current value
            this.writePins[id].high();
            
            await delay(50);

            this.readPins[id].query((state) => {

                //console.log("Pin" + id + " Value: " + state.value);

                const resistance = this.calculatePulldownResistance(state.value * (5.0 / 1023.0));
                //console.log("Pin" + id + " Resistance: " + resistance);

                if (state.value > 1000 || state.value < 3) {
                    this.pinsResistances[id] = null;
                    this.hangers[id] = null;
                }

                else {
                    const resistance = this.calculatePulldownResistance(state.value * (5.0 / 1023.0));
                    
                    
                    // Find the hanger with the closest resistor value
                    let bestMatch = null;
                    let smallestDiff = Infinity;
                    for (const hanger of hangers) {
                        const diff = Math.abs(resistance - hanger.resistance);
                        if (diff < smallestDiff) {
                            smallestDiff = diff;
                            bestMatch = hanger;
                        }
                    }
                        

                    this.hangers[id] = bestMatch;
                    this.pinsResistances[id] = resistance;
                    //console.log("Hanger at pin " + id + ": ", bestMatch ? bestMatch.id : null, resistance);
                }
            });

            this.writePins[id].low();

            await delay(10);
        }
    }

    // Check all pins
    async checkPins() {
        let index = 0;
        while (index < this.readPins.length) {
            await this.checkPin(index);
            index++;
        }

       //this.hangers = this.sortHangersBasedOnPins(this.pinsResistances)

        const data = this.hangers.map(h => h ? 1 : 0)
        console.log(this.hangers.map(h => h ? h.id : null), this.id);
        //emitChanges(this.hangers, this.id);
        //this.oldHangers = [...this.hangers];
        //await postData(data, this.id);
    }

    sortHangersBasedOnPins(PinResistances) {
        const sortedHangers = [];

        for (const resistance of PinResistances) {
            let bestMatch = null;
            let smallestDiff = Infinity;
            let diff = Infinity;
            for (const hanger of hangers) {
                const diff = Math.abs(resistance - hanger.resistance);
                if (diff < smallestDiff && sortedHangers.find(h => h.bestMatch == hanger) == undefined) {
                    smallestDiff = diff;
                    bestMatch = hanger;
                }
            }

            sortedHangers.push({hanger: bestMatch, diff: diff});
        }

        return sortedHangers;
    }

    // Calculate resistance from voltage
    calculateResistance(voltage) {
        const v = 5.0
        const resistance = this.resistor * ((v / voltage) - 1)
        //console.log("resistance: " , resistance)
        return (resistance);
    }

    //pulldownresistance
    calculatePulldownResistance(voltage) {
        //console.log("Voltage: ", voltage)
        const v = 5.0
        const resistance = (voltage * this.resistor) / (v - voltage)
        console.log("resistance: " , resistance)
        return (resistance);
    }

    lightHanger(hangerID){
        const pin = this.hangerToPin(hangerID)
        console.log("Lighting hanger ", hangerID, " at pin ", pin)
        if (pin != -1)
        {
            this.lightStatus[pin] = 1
            console.log("Lighting hanger ", hangerID)
        }

        //await postData(this.lightStatus, this.id)
    }

    hangerOff(hangerID){
        const pin = this.hangerToPin(hangerID)
        if (pin != -1 && pin)
        {this.lightStatus[pin]=0}
    //await postData(this.lightStatus, this.id)
    }   

    async lightManyHangers(hangerIDs){
        console.log("Lighting these hangers: ", hangerIDs)
        this.lightStatus = [0,0,0,0,0]
        for(const id of hangerIDs) {
            this.lightHanger(id)
        }
        //console.log(this.lightStatus)
        //await postData(this.lightStatus, this.id)
    }

    //gives the pin index of the hanger present
    hangerToPin(hangerID) {
        //console.log("Finding pin for hanger ", this.hangers.findIndex(h => h && h.id === hangerID))

        return this.hangers.findIndex(h => h && h.id === hangerID);
    }
}

// lights up the hanger containing the chosen cloth via the right pin
    // lightHanger(hangerID) {
    //     const pinIndex = this.hangerToPin(hangerID)
    //     this.lightPin(pinIndex)
    // }

const boards = new Boards([
  { id: 1, port: "/dev/tty.usbmodem11101" },
  { id: 2, port: "/dev/tty.usbmodem11401" }
]);

//id of the first arduino
let arduinos = []

let nowReady = false;


boards.on("ready", async () => {
    arduinos = [new Arduino(1, boards.byId(1)), new Arduino(2, boards.byId(2))];
    arduinos.forEach(arduino => arduino.initialize());
    const button = new Button({ pin: "A5", board: boards.byId(1), isPullup: true });
    button.on("press", () => {
        console.log("Button pressed");
        toggleRecording();
    });
    nowReady = true;
});
/*
setTimeout(() => {
    if (arduino.ready && arduino2.ready) {
        pins.push(...arduino.readPins);
        pins.push(...arduino2.readPins);
        console.log("All read pins:", pins);
    }
}, 10000);
*/



//const arduinos = [arduino, arduino2] //, arduino2]


let current = 0;

async function alternatingLoop() {



    // Make sure both Arduinos are ready before starting
    if (!nowReady) {
        console.log("Waiting for Arduinos...");
        return setTimeout(alternatingLoop, 500);
    }
    const board = arduinos[current];

    //console.log("Checking Arduino", board.id);
    await board.checkPins();

    current = (current + 1) % arduinos.length; // alternate 0→1→0→1

    setTimeout(alternatingLoop, 300); // run again in 1 second

    emitChanges(returnHangers());
}

alternatingLoop();



/*
while (true) {
    console.log("Checking all arduinos")
    if (arduino.ready && arduino2.ready) {
        for (const arduino of arduinos) {
            console.log("Checking pins for arduino ", arduino.id)
            await arduino.checkPins();
            sleep(300);
        }
    }
    
    sleep(100)
}
    */

/*
function myLoop() {
    setTimeout(async () => {
        if (!arduino.ready || !arduino2.ready) {
            console.log("Not ready yet...");
            return myLoop(); // keep waiting
        }

        console.log("CHECK");

        if (i % 2 === 0) {
            console.log("Arduino 1 check");
            await arduino.checkPins();
        } else {
            console.log("Arduino 2 check");
            await arduino2.checkPins();
        }

        i++;
        myLoop(); 
    }, 300);
}

myLoop();  
*/



/*
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
*/

async function lightHangers(indexes) {
    const data = []
    
    for (const arduino of arduinos) {
        arduino.lightManyHangers(indexes)
        data.push(...arduino.lightStatus)
    }

    await postData(data);
}

function returnHangers() {
    const data = []
    for (const arduino of arduinos) {
        data.push(...arduino.hangers)
    }
    return data;
}

function emitChanges(change) {
    emitter.emit("clothes-lifted", change);
}

//arduino.writePins[0].high();


/*
while (true) {
    await delay(1000);
    arduino.writePins[0].high();
    await delay(1000);

    arduino.readPins[0].query((state) => {
        const resistance = arduino.calculateResistance(state.value * (5.0 / 1023.0));
        console.log("Pin" + 0 + " Resistance: " + resistance);
    })
    arduino.writePins[0].low();
    
    //await arduino.checkPin(0);
    //console.log(arduino.pinsResistances[0])
}
    */


export {lightHangers, returnHangers, emitter, toggleRecording, emitChanges}
