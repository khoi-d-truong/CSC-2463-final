
let theme = ["c#5","d#5","f5","g#5",["f5","f#5","f5"]];
let synth = new Tone.DuoSynth({
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
})
let dist = new Tone.Distortion(.3);
synth.connect(dist);
dist.toDestination();

let sequence1 = new Tone.Sequence (function (time,note){
  synth.triggerAttackRelease(note,0.8);
}, theme, "4n");

//Tone.Transport.start();
Tone.Transport.bpm.value = 100;
Tone.Transport.timeSignature = [3,4];


let notes = {
  'q' : 'C5',
  '2' : 'c#5',
  'w' : 'D5',
  '3' : "d#5",
  'e' : 'E5',
  'r' : 'F5',
  '5' : 'f#5',
  't' : 'G5',
  '6' : 'g#5',
  'y' : 'A5',
  '7' : 'a#5',
  'u' : 'B5',
  'i' : 'C6',
}

function setup() 
{
  createCanvas(600, 400);

  //A button to set the distortion to max
  distButton = createButton ('Activate Distortion');
  distButton.position (100,300);
  distButton.mousePressed(() => dist.distortion = 1);

  //A button to reset the distortion
  nodistButton = createButton('Turn off distortion');
  nodistButton.position (400,300);
  nodistButton.mousePressed(() => dist.distortion = 0.1);

  //An array of the available keys
  piano = [
    new PianoKey (100,50,'C4','q'),
    new PianoKey (150,50,'D4','w'),
    new PianoKey (200,50,'E4','e'),
    new PianoKey (250,50,'F4','r'),
    new PianoKey (300,50,'G4','t'),
    new PianoKey (350,50,'A4','y'),
    new PianoKey (400,50,'B4','u'),
    new PianoKey (450,50,'C5','i')
  ]
}

//Plays the note on key press
function keyPressed()
{
  let playNotes = notes[key];
  synth.triggerAttackRelease(playNotes,'0.3');
}

//Stops the note on key release
function keyReleased()
{
  let playNotes = notes[key];
  synth.triggerRelease(playNotes, '+0.03');
}


function draw() 
{
  background(255);

  for (let i = 0; i < piano.length; i++)
    piano[i].draw();
}

function mousepressed(){
  Tone.start();
  sequence1.start();
}

function mouseReleased(){
  sequence1.start();
}

class PianoKey
{
  constructor(x,y,note,keyNote)
  {
    this.x = x;
    this.y = y;
    this.note = note;       //The actual note
    this.keyNote = keyNote; //The keyboard input for the note
  }

  //Draws a rectangle and the two notes as text objects
  draw()
  {
    push();
    rect(this.x,this.y,50,200);
    textSize(18);
    textAlign(CENTER)
    text( this.keyNote, this.x+25,this.y+20);
    text( this.note, this.x+25, this.y+190);
    pop();
  }

}