// Variable declaration
let four_squares;               // Array to hold tiles
let score, highscore;           // Holds current score and overall highscore
let find_circle = false;        // Boolean to ensure there's a circle onscreen
let turn_time, max_time;        // How much time is left for the current turn and the time length to reset to
let finished_playing = false;   // Boolean to check if the player is still playing. True triggers ending screen
let opening_screen = true;      // Boolean to check if game has started. False triggers game start
let circle_count = 0;           // Check if there are multiple circles. If circles > 1, only accept space bar
let level = 0;                  // Determine the bgm. Plays higher sequence every 10 points
let wait_for_spacebar = false;  // Boolean to check if the correct input is the space bar
const START_TIME = 8;           // Default amount of time interval for the game to begin with
let connectButton;                // Button to connect to Arduino
let inputs;                       // Recieve input from Arduino


// Membrane synth that will play on square selection/spacebar typed
let mSynth = new Tone.MembraneSynth({
  oscillator: {
    type: 'sine'
  },
  envelope :
  {
    attack: .01,
    decay: 0.5,
    sustain: .75,
    release: .1,
  }
}).toDestination();

// Duo synth to play the game's music and ending theme
let dSynth = new Tone.DuoSynth({
  oscillator: {
    type: 'square'
  },
  envelope :
  {
    attack: .5,
    decay: 0.5,
    sustain: .01,
    release: .01,
  }
}).toDestination();

// Adding distortion to the duo synth
let dist = new Tone.Distortion(.3);
dSynth.connect(dist);
dist.toDestination();

// 3 seperate themes of increasing octaves. Moves up an octave after 10 points
// I only needed 3 because it's really hard to get to 30 points
theme1 = [["c4","c#4","d4","d#4"]];
theme2 = [["c5","c#5","d5","d#5"]];
theme3 = [["c6","c#6","d6","d#6"]];

// Theme to play on ending screen
ending_theme = ['c4','e4','g4','b4','c5','b4','g4','e4']

// Connecting the sequences to the dSynth
let bgm1 = new Tone.Sequence (function (time,note){
  dSynth.triggerAttackRelease(note,0.8);
}, theme1, "4n");

let bgm2 = new Tone.Sequence (function (time,note){
  dSynth.triggerAttackRelease(note,0.8);
}, theme2, "4n");

let bgm3 = new Tone.Sequence (function (time,note){
  dSynth.triggerAttackRelease(note,0.8);
}, theme3, "4n");

let esm = new Tone.Sequence (function (time,note){
  dSynth.triggerAttackRelease(note,0.8);
}, ending_theme, "4n");

// Starting transport to play themes
Tone.Transport.start();
Tone.Transport.bpm.value = 100;
Tone.Transport.timeSignature = [3,4];

// Preloading values
function preload()
{
  // Creating 4 tile objects
  four_squares = 
  [
    new tile(0,0,'crimson','c4'),
    new tile(200,0,'lemonchiffon','d4'),
    new tile(0,200,'mediumslateblue','e4'),
    new tile(200,200,'palegreen','f4')
  ];

  // Setting default values for score, highscore, the max time interval, and the current time interval
  score = 0;
  highscore = 0;
  max_time = START_TIME;
  turn_time = max_time;
}

// Setup function
function setup() {
  // Creating rectangular canvas
  createCanvas(600, 400);
  // Creating Serial object
  port = createSerial();
  // Button to connect arduino
  connectButton = createButton("Connect Arduino");
  connectButton.mousePressed(connect);

  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) port.open(usedPorts[0],9600);
}

// Main draw() function
function draw() {
  // Setting background color to off-white
  background(250);
  
  // If the game hasn't started yet, show opening screen
  if (opening_screen) draw_opening_screen();
  // If game is over, show the game over screen
  else if (finished_playing) gameOver();
  // Otherwise, play the game
  else playGame();
}

// Opening screen function
function draw_opening_screen()
{
  // Making the following attributes local
  push();
    // Darken background so that text is visible
    background(50);
    // Larger font for readibility
    textSize(24);
    // Center the following text
    textAlign("center")
    // Each of the following lines have a different color, same as the four tiles
    fill("crimson");
    text("WELCOME TO CLICK THE CIRCLE!", width/2, 100);
    fill("mediumslateblue");
    text("THE RULES ARE SIMPLE:", width/2, 175);
    fill("lemonchiffon");
    text("CLICK THE CIRCLES, AND ONLY THE CIRCLES", width/2, 250);
    text("BUT ! IF THERE'S MORE THAN 1 CIRCLE,", width/2, 275);
    text(" PRESS THE SPACEBAR ", width/2, 300);
    fill("palegreen");
    text("CLICK THE SCREEN TO PLAY!", width / 2, 350);
  pop();
  // End push()

  // Await the button press to start game
  inputs = port.readUntil("\n");
  // Upon reading input
  if (inputs != ""){
    opening_screen = false;   // Leave opening screen. Game will see that the flag for finished is false and start playing
    bgm1.start();             // Game always starts with level 1 music
  }

}

// Main game function
function playGame()
{
  // Display score and time on the side of the screen not occupied by tiles
  textAlign("CENTER");
  textSize(20);
  text ("Score :" + score, 450, 100);
  text ("Time : " + turn_time.toFixed(1), 450, 150 );
  
  // Draw tiles
  for (i = 0; i < four_squares.length; i++) four_squares[i].draw();
  // Make sure that there's a circle onscreen
  find_circle = check_for_circle(four_squares);
  // If no circles, assign a circle to one of the tiles at random
  if (!find_circle){
    let r = ceil(random(0,4))-1;
    four_squares[r].shape = "circle";
    four_squares[r].draw();
  }
  
  // Make sure to count circles on the first turn
  if (score === 0) count_circles();

  // If there are multiple circles, set flag for spacebar input to true
  if (circle_count >=2) wait_for_spacebar = true;  
  
  // Update timer
  turn_time -= deltaTime / 500;
  // Once timer hits zero
  if (turn_time <= 0)
  {
    finished_playing = true;        // Game over
    port.write("0 0 0 0");          // Turn off all the lights
    esm.start();                    // Start music for end screen
  }
}

// Ending screen function
function gameOver()
{
  // Turn off the appropriate sequence
  if (level === 0) bgm1.stop();
  else if (level === 1) bgm2.stop();
  else if (level === 2) bgm3.stop();

  // If the new score is higher than the previous high score
  if (score > highscore) highscore = score;       // Update highscore

  // Set the background to off white
  background(250);

  // Making the following attributes local
  push();
  frameRate(5);     // Slow down frame rate so that the color changing doesn't go too fast
  strokeWeight (.5);  // Thin the outlines of the square frames
  // Create a border of squares
  // Will be filled with a range of changing, random colors
  for (i = 0; i < 12; i ++)
  {
    fill(randomColor()); // Function to pick random color from pool of 4
    square(i*50,0,50);
    square(i*50,50,50);
    square(i*50,300,50);
    square(i*50,350,50);
  }

  // Making the following attributes local
  push();

  // Display results
  textSize(32);
  textAlign("center")
  text("G A M E O V E R", width/2, 160);
  text("S C O R E : " + score, width/2, 200);
  text("H I G H S C O R E : " + highscore, width / 2, 240);
  text("Press button to play again!", width / 2, 280);
  pop();
  // Ending push() for result text
  pop();
  // Ending push() for ending screen

  // Wait for button input
  inputs = port.readUntil("\n");
  // If button is pressed
  if (inputs != "")
  {
    // Reset stats and restart game
  finished_playing = false;
  score = 0;
  level = 0;
  max_time = START_TIME;
  turn_time = max_time;
  esm.stop();
  bgm1.start(); 

  }
}

// Class for the selectable tiles
// Consists of a square body, with a shape within and an assigned color
class tile 
{
  // Needs x-coordinate, y-coordinate, color, and note to play on click
  constructor (x,y,color,note)
  {
    this.x = x;
    this.y = y;
    this.fill = color;
    this.shape = this.randomShape();    // Choose a random shape from a pool of 4
    this.note = note;
  }

  // Draw the tile
  draw()
  {
    // Making the following attributes local
    push()
    fill(this.fill);
    strokeWeight(4);
    square(this.x,this.y,200);
    pop();
    // Ending the push()
    this.drawShape();   // Function to draw the shape within the tile
    
  }

  // Drawing the assigned shape. 4 total choices: square, triangle, circle, or x
  drawShape()
  {
    // Making the following attributes local
    push()
    strokeWeight(5);
    // Make the shapes filled with color of tile
    noFill();
    switch (this.shape)
    {
      case "square":
        square(this.x+50,this.y+50,100);
        break;

      case "triangle":
        triangle(this.x+100,this.y+50,
                 this.x+50,this.y+150,
                 this.x+150,this.y+150);
        break;

      case "x":
        push()
        strokeWeight(7)
        line(this.x+40,this.y+40,
             this.x+160,this.y+160);
        line(this.x+40,this.y+160,
            this.x+160,this.y+40);
        pop();
        break;

      case "circle":
        circle (this.x+100,this.y+100,100);
        break;
        
      default:
        break;
    }
    pop();
    // Ending push()
  }

  // Function to select 1 of 4 random shapes: square, triangle, circle, or x
  randomShape()
  {
    let x = ceil(random(0,4));  // Pick a random number, 1-4
    let shape_temp = "";
    switch (x)
    {
      case 1: 
        shape_temp = "square";
        break;
      case 2:
        shape_temp = "triangle";
        break;
      case 3:
        shape_temp = "circle";
        break;
      case 4:
        shape_temp = "x";
        break;
    }
    return shape_temp;

  }

  // Given an x and y coordinate, check to see if it's within the given tile
  isClicked(x,y)
  {
    return (x >= this.x && x <= this.x+200 &&
            y >= this.y && y <= this.y+200);
  }

  // Play this.note on a mono synth
  playNote()
  {
    mSynth.triggerAttackRelease(this.note,'0.3');
  }
}

// Function that reads through array of tiles
// Returns true if 1 of the tiles has a circle, false otherwise
function check_for_circle(tile_array)
{
  for (i = 0; i < tile_array.length; i++)
  {
    if (tile_array[i].shape === "circle") return true;
  }
  return false;
}

// Whenever mouse is clicked
function mouseClicked()
{
  // Check to make sure game is still being played
  if (!finished_playing)
  {
    if (opening_screen){
      opening_screen = false;   // Leave opening screen. Game will see that the flag for finished is false and start playing
      bgm1.start();             // Game always starts with level 1 music
    }
  // If the correct input is the spacebar -> game over
  if (wait_for_spacebar)
  { 
    finished_playing = true;
    port.write("0 0 0 0\n");
    esm.start();
  }
  // Otherwise
  for (let i = 0; i < four_squares.length; i++)
  {
    // Check to see if any of the tiles have been clicked
    if (four_squares[i].isClicked(mouseX,mouseY))
    {
      // If a circle tile is clicked, that's correct!
      if (four_squares[i].shape === "circle")
      { 
        four_squares[i].playNote();
        score ++;
      }
      // Otherwise -> game over
      else 
      {
        finished_playing = true;
        port.write("0 0 0 0\n");
        esm.start();
      }
    }
  }
  // If one of the tiles was clicked -> resest turn
  if (mouseX <= 400 && mouseY <= 400) reset();

  // If the score is divisible by 3, shorten the max interval
  // Max interval can not get shorter than 1 second
  if (score > 0 && score % 3 == 0 && max_time >= 1)
  {
    max_time = max_time-1;
    if (max_time == 0 ) max_time = 1; 
  } 
  }
}

// Function to check for keyboard input
function keyPressed()
{
  // If the game was not waiting for spacebar -> game over
  if (!wait_for_spacebar) 
  {
    finished_playing = true;
    port.write("0 0 0 0\n");
    esm.start();
  }

  // If the game is waiting for spacebar and the spacebar is typed -> correct input
  if (keyCode === 32 && wait_for_spacebar)
  {
    mSynth.triggerAttackRelease('g4','0.3');
    score ++;
    reset();
    wait_for_spacebar = false;    // Set spacebar boolean flag to false again
  }
}

// Function to reset tiles for new turn
function reset()
{
  // Redraw tiles with new random shapes
  for (let i = 0; i < four_squares.length; i++)
  {
    four_squares[i].shape = four_squares[i].randomShape();
    four_squares[i].draw();
  }
  // Make sure that there's at least 1 circle
  find_circle = check_for_circle(four_squares);
  if (!find_circle){
    let r = ceil(random(0,4))-1;
    four_squares[r].shape = "circle";
    four_squares[r].draw();
  }
  // Function to pass a string to Aruino
  // Should light up respective light for all circle tiles
  send_circle_string();
  // Reset spacebar boolean flag to false
  wait_for_spacebar = false;
  // Reset time interval
  turn_time = max_time;
  // Count # of circles onscreen
  count_circles();

  // When score gets to ten, move up a level and raise the music's octave
  if (score == 10)
  {
    level = 1;
    bgm1.stop();
    bgm2.start();
  }
  // When score gets to twenty, move up a level and raise the music's octave
  if (score == 20)
  {
    level = 2;
    bgm2.stop();
    bgm3.start();
  }
}


// Function to select a random color from a pool of 4
function randomColor()
{
  let r = ceil(random(0,4))
  switch (r)
    {
      case 1: 
        return "mediumslateblue";
        break;
      case 2:
        return "lemonchiffon";
        break;
      case 3:
        return "palegreen";
        break;
      case 4:
        return "crimson";
        break;
    }
}

// Function to count the number of circles onscreen
// Updates circle_count global
function count_circles()
{
  circle_count = 0;   // Reset circle_count to 0 before counting, so that the value doesn't just increase unfettered
  for (let i = 0; i < four_squares.length; i++)
  {
    if (four_squares[i].shape === "circle") circle_count++;
  }
}

// Function to sent a modified string to arduino
function send_circle_string()
{
  // Empty string
  let temp = "";
  for (let i = 0; i < four_squares.length; i++)
  {
    // Add a 1 for a circle
    if (four_squares[i].shape === "circle") temp += "1";
    // Add a 0 otherwise
    else temp += "0";
    // Add a space unless final char
    if (i != 3) temp += " ";
    // End with newline
    else temp +="\n";
  }
  // Send string to arduino
  port.write(temp);
}

// Function to connect to arduino
function connect()
{
if (!port.opened()) port.open('Arduino', 9600);
else port.close();
}
