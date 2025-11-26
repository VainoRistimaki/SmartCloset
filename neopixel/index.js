express = require('express');
cors =  require('cors');
five = require('johnny-five')
pixel = require('node-pixel')
//test
const app = express();
const PORT = 3000;

let hangers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const opts = '/dev/tty.usbmodem11101';
 
var board = new five.Board(opts);
var strip = null;

var hangerLength = 5;
var hangerAmount = 12;

var ready = false;
var thisStrip = null;
 
board.on("ready", function() {
 
    strip = new pixel.Strip({
        board: this,
        controller: "FIRMATA",
        strips: [ {pin: 6, length: 60}, ], // this is preferred form for definition
        gamma: 2.8, // set to a gamma that works nicely for WS2812
    });
 
    strip.on("ready", function() {
        ready = true;
        thisStrip = strip;
        //strip.color("#ffffff");
        strip.off();

        //strip.color("#00ffff");
        //const color = "hsl(" + 0 + " , 100%, 50%)";
        //console.log(color)
        //strip.pixel(0).color("0x00ff00");

        // do stuff with the strip here.
    });
});



// Middleware
app.use(cors());
app.use(express.json());

app.post('/', async (req, res) => {
  const body = req.body;
  const theseHangers = body.hangers;
  const thisID = body.arduinoID;

  if (thisID == 1) {
    hangers = [...theseHangers,  ...hangers.slice(theseHangers.length)]
  }
  else {
    hangers = [...hangers.slice(0, hangerAmount - theseHangers.length), ...theseHangers]
  }

    if (ready && thisStrip) {
        //thisStrip.off()
        for (let i = 0; i < hangers.length; i++) {
            const hangerState = hangers[i];
            if (hangerState != 0) {
                for (let j = 0; j < hangerLength; j++) {
                    const color = "#00ffff"
                    thisStrip.pixel(i * hangerLength + j).color(color);
                }
                //const color = "#00ffff"
                //thisStrip.pixel(i).color(color);
                //thisStrip.pixel(i).show();
            }

            else {
                for (let j = 0; j < hangerLength; j++) {
                    thisStrip.pixel(i * hangerLength + j).off();
                }
            }
        }
        thisStrip.show();
    }



  console.log("Hangers updated:", hangers);
  res.status(200).json({ message: 'Hangers updated successfully' });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
