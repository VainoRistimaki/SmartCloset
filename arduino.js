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

class Arduino {

    constructor(id, port) {
        this.id = id;
        this.port = port;
        this.board = new Board({ port: this.port, debug: true });
        this.ready = false;
        this.pins = []
        this.hangers = [null, null, null, null, null, null];
        this.resistor = 10000

        this.initialize();
    }

    initialize() {
        this.board.on('ready', async function () {
            // Initialize analog pins A1 to A6
            for (let i = 0; i < 6; i++) {
                this.pins.push(new Pin("A" + (i + 1)))
            }
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
    checkPin(id) {
        if (this.ready) {
            // Query the pin for its current value
            this.pins[id].query((state) => {
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
            });
        }
    }

    // Check all pins
    checkPins() {
        for (let i = 0; i < this.pins.length; i++) {
            this.checkPin(i);
        }
    }

    // Calculate resistance from voltage
    calculateResistance(voltage) {
        const v = 5;
        return (this.resistor * (v - voltage)) / voltage;
    }



}

export default Arduino;