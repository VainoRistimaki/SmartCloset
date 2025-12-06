import { read } from "fs";
import five from "johnny-five";
const { Boards, Pin } = five;

const boards = new Boards([
  { id: "one", port: "/dev/tty.usbmodem11101" },
  { id: "two", port: "/dev/tty.usbmodem11401" }
]);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

boards.on("ready", () => {
  console.log("Both boards ready!");

  const pin1 = new Pin({ pin: 3, board: boards.byId("one") });
  const pin2 = new Pin({ pin: 3, board: boards.byId("two") });
  

  const readPin1 = new Pin({ pin: "A0", board: boards.byId("one") });

  pin1.high();
  pin2.high();

  setInterval(() => {
    readPin1.query((state) => {
        console.log("Read pin value from board one:", state.value);
    })
  }, 1000)
});

