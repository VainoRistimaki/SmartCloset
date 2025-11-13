import five from 'johnny-five';
const { Board, Led, Pin } = five;

class hanger {
    constructor(id, resistor) {
        this.id = id;
        this.resistor = resistor;
    }
}

const hangers = [
    new hanger(0, 10000),
    new hanger(1, 20000),
    new hanger(2, 30000),
    new hanger(3, 40000),
    new hanger(4, 50000),
    new hanger(5, 60000),
]

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Arduino {

    constructor(id, port) {
        this.id = id;
        this.port = port;
        this.board = new Board({ port: this.port, debug: true });
        this.ready = false;
        this.readPins = []
        this.writePins = [3, 5, 6, 9, 10, 11]
        this.hangers = [null, null, null, null, null, null];
        this.resistor = 10000

        this.initialize();
    }

    async initialize() {
        this.board.on('ready', async function () {
            // Initialize analog pins A1 to A6
            for (let i = 0; i < 6; i++) {
                this.readPins.push(new Pin("A" + i))
            }
            this.writePins.map(pinNum => {
                return new Pin(pinNum);
            })
            // Set the board as ready
            this.ready = true;
            console.log(`Arduino board ${this.id} is ready on port ${this.port}`);
            
            // Check pins every second
            setInterval(() => {
                this.checkPins();
            }, 1000);
        })
    }

    // Check a specific pin
    async checkPin(id) {
        if (this.ready) {
            // Query the pin for its current value
            this.writePins[id].high();

            delay(10);

            this.readPins[id].query((state) => {

                if (state.value < 0.001) {
                    this.hangers[id] = null;
                }

                else {
                    const resistance = this.calculateResistance(state.value);
                    
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

                }

            });

            this.writePins[id].low();
        }
    }

    // Check all pins
    async checkPins() {
        for (let i = 0; i < this.readPins.length; i++) {
            await this.checkPin(i);
        }
    }

    // Calculate resistance from voltage
    calculateResistance(voltage) {
        const v = 5;
        return (this.resistor * (v - voltage)) / voltage;
    }



}

export default Arduino;