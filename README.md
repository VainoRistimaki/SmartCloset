# SmartCloset

## setting up the environment:

### Mac:

#### 1. install nvm (Node Version Manager):
brew install nvm
mkdir ~/.nvm
nano ~/.zshrc

add this to the bottom of the file:

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

save the file and restart terminal

#### 2. Check if nvm is there
nvm --version

should show a version number. If not, nvm is not installed

#### 3. plug in the arduino that controls the neopixel

/dev/tty.*
copy the port to the neopixel/index.js

#### 4. Plug in the arduinos detecting the hangers

/dev/tty.*
copy the ports of the arduinos to src/arduino.js

#### 5. Open A DIFFERENT terminal in the root

cd neopixel
nvm install 12
nvm use 12

#### 6. Install dependencies

npm install

#### 7. Run the code

node index.js

#### 8. install node 22 (IN THE DIFFERENT TERMINAL!!!)

cd ../src
nvm install 22
nvm use 22
npm install

#### 9. run the other code

node arduino.js




