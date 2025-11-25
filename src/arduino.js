import five from 'johnny-five';
const { Board, Led, Pin } = five;

class hanger {
    constructor(id, resistor) {
        this.id = id;
        this.resistor = resistor;
    }
}

const hangers = [
    new hanger(0, 10),
    new hanger(1, 47),
    new hanger(2, 100),
    new hanger(3, 220),
    new hanger(4, 330),
    new hanger(5, 470),
    new hanger(6, 680),
    new hanger(7, 1000),
    new hanger(8, 2200),
    new hanger(9, 3300),
    new hanger(10, 4700),
    new hanger(11, 10000),
]

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postData(data) {
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

    constructor(id, port) {
        this.id = id;
        this.port = port;
        this.board = new Board({ port: this.port, debug: true });
        this.ready = false;
        this.readPins = []
        this.writePins = [3, 5, 6, 9, 10, 11]
        this.hangers = [null, null, null, null, null, null];
        this.resistor = 220

        this.pinsResistances = [0, 0, 0, 0, 0, 0];

        
        this.initialize();
        
    }

    async initialize() {
        this.board.on('ready', async () => {
            // Initialize analog read pins A0 to A5
            for (let i = 0; i < 6; i++) {
                this.readPins.push(new Pin("A" + i))
            };
            // Initialize write pins 3,5,6,9,10,11
            this.writePins = this.writePins.map(pinNum => new Pin(pinNum));
            // Set the board as ready
            this.ready = true;
            console.log(`Arduino board ${this.id} is ready on port ${this.port}`);
            
            /*
            // Check pins every second
            setInterval(async () => {
                await this.checkPins();
            }, 8000);
            */

            
            this.pollingLoop();
            
        })
    }

    async pollingLoop() {
        while (true) {
            await this.checkPins();
            await delay(500);
        }
    }

    // Check a specific pin
    async checkPin(id) {
        if (this.ready) {
            // Query the pin for its current value
            this.writePins[id].high();
            
            await delay(50);

            this.readPins[id].query((state) => {

                const resistance = this.calculateResistance(state.value * (5.0 / 1023.0));
                //console.log("Pin" + id + " Resistance: " + resistance);

                if (state.value < 10) {
                    this.hangers[id] = null;
                }

                else {
                    const resistance = this.calculateResistance(state.value * (5.0 / 1023.0));
                    
                    // Find the hanger with the closest resistor value
                    let bestMatch = null;
                    let smallestDiff = Infinity;
                    for (const hanger of hangers) {
                        const diff = Math.abs(resistance - hanger.resistor);
                        if (diff < smallestDiff) {
                            smallestDiff = diff;
                            bestMatch = hanger;
                        }
                    }

                    this.hangers[id] = bestMatch;
                    this.pinsResistances[id] = resistance;

                }
            });

            this.writePins[id].low();
        }
    }

    // Check all pins
    async checkPins() {
        let index = 0;
        while (index < this.readPins.length) {
            await this.checkPin(index);
            index++;
        }
        const data = this.hangers.map(h => h ? 1 : 0)
        console.log(this.hangers);
        await postData(data);
    }

    // Calculate resistance from voltage
    calculateResistance(voltage) {
        const v = 5.0
        const resistance = this.resistor * ((v / voltage) - 1)
        //console.log("resistance: " , resistance)
        return (resistance);
    }

// lights up the pin with the right index on the arduino
    lightPin(index) {
        if (this.ready) {
            this.writePins[index].high()
        } 
    }
// closes a pin (and light) 
    closePin(index) {
        if (this.ready) {
            this.writePins[index].low()
        }
    }

    //closes all pins
    closeAllPins() {
        if (this.ready) {
            for (const pin of this.writePins) {
                pin.low()
            }
        }
    }

    //gives the pin index of the hanger present
    hangerToPin(hangerID) {
        return this.hangers.findIndex(h => h && h.id === hangerID);
    }

// lights up the hanger containing the chosen cloth via the right pin
    lightHanger(hangerID) {
        const pinIndex = this.hangerToPin(hangerID)
        this.lightPin(pinIndex)
    }

    //closes led in hanger
    closeHanger(hangerID) {
        const pinIndex = this.hangerToPin(hangerID)
        this.closePin(pinIndex)
    }

}


const arduino = new Arduino(1, "/dev/tty.usbmodem11101");



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




export default Arduino;