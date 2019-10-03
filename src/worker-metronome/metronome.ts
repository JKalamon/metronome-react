export class Metronome {
  public audioContext: any = null;
  public unlocked = false;
  public isPlaying = false;      // Are we currently playing?
  public startTime: number = 0;              // The start time of the entire sequence.
  public current16thNote: number = 0;        // What note is currently last scheduled?
  public tempo = 120.0;          // tempo (in beats per minute)
  public lookahead = 25.0;       // How frequently to call scheduling function 
  //(in milliseconds)
  public scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
  // This is calculated from lookahead, and overlaps 
  // with next interval (in case the timer is late)
  public nextNoteTime = 0.0;     // when the next note is due.
  public noteResolution = 2;     // 0 == 16th, 1 == 8th, 2 == quarter note
  public noteLength = 0.05;      // length of "beep" (in seconds)  
  public last16thNoteDrawn = -1; // the last "box" we drew on the screen
  public notesInQueue: { note: number, time: number }[] = [];      // the notes that have been put into the web audio,
  // and may or may not have played yet. {note, time}
  public timerWorker: any = null;     // The Web Worker used to fire timer messages
  public lastFillColor = "black";
  private windowAsAny = window as any;

  constructor() {
    // First, let's shim the requestAnimationFrame API, with a setTimeout fallback
    this.windowAsAny.requestAnimFrame = (() => {
      return this.windowAsAny.requestAnimationFrame ||
        this.windowAsAny.webkitRequestAnimationFrame ||
        this.windowAsAny.mozRequestAnimationFrame ||
        this.windowAsAny.oRequestAnimationFrame ||
        this.windowAsAny.msRequestAnimationFrame ||
        function (callback: any) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
  }


  nextNote = () => {
    // Advance current note and time by a 16th note...
    const secondsPerBeat = 60.0 / this.tempo;    // Notice this picks up the CURRENT 
    // tempo value to calculate beat length.
    this.nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    this.current16thNote++;    // Advance the beat number, wrap to zero
    if (this.current16thNote == 16) {
      this.current16thNote = 0;
    }
  }

  scheduleNote = (beatNumber: number, time: number) => {
    // push the note on the queue, even if we're not playing.
    this.notesInQueue.push({ note: beatNumber, time: time });

    if ((this.noteResolution == 1) && (beatNumber % 2))
      return; // we're not playing non-8th 16th notes
    if ((this.noteResolution == 2) && (beatNumber % 4))
      return; // we're not playing non-quarter 8th notes

    // create an oscillator
    var osc = this.audioContext.createOscillator();
    osc.connect(this.audioContext.destination);
    if (beatNumber % 16 === 0)    // beat 0 == high pitch
      osc.frequency.value = 880.0;
    else if (beatNumber % 4 === 0)    // quarter notes = medium pitch
      osc.frequency.value = 440.0;
    else                        // other 16th notes = low pitch
      osc.frequency.value = 220.0;

    osc.start(time);
    osc.stop(time + this.noteLength);
  }

  scheduler = () => {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
  }

  play = () => {
    //document.getElementById("controls").remove();

    if (!this.unlocked) {
      // play silent buffer to unlock the audio
      let buffer = this.audioContext.createBuffer(1, 1, 22050);
      let node = this.audioContext.createBufferSource();
      node.buffer = buffer;
      node.start(0);
      this.unlocked = true;
    }

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) { // start playing
      this.current16thNote = 0;
      this.nextNoteTime = this.audioContext.currentTime;
      this.timerWorker.postMessage("start");
      return "stop";
    } else {
      this.timerWorker.postMessage("stop");
      return "play";
    }
  }
}
