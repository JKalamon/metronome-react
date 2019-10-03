export class MessyMetronome {
  context = new AudioContext();

  public bpm = 60;
  public callback: Function | null = null;
  public currentBeat = 1;
  public isWorking = false;

  public start = () => {
    if (this.isWorking) {
      return;
    }

    this.isWorking = true;
    this.currentBeat = 1;
    this.work();
  };

  public stop() {
    this.isWorking = false;
  }

  private work = () => {
    if (!this.isWorking) {
      return;
    }

    console.log(this.currentBeat);
    const now = this.context.currentTime;

    // How many beats fit in a single second at the given bpm? e.g.
    // 60 bpm = 1 beat per second
    // 120 bpm = 2 beats per second
    // 240 bpm = 4 beats per second
    const beatsPerSecond = this.bpm / 60.0;

    // Our base unit is a quarter note. This defines how many quarter notes fit
    // in a single bar. For now let's use common 4/4 time.
    const quarterBeatsPerBar = 4;

    // Multiplying the number of beats in 1 second by the number of quarter
    // beats in a bar, we get the actual number of beats we want in a single bar e.g.
    // 1 beat per second * 4 = 4 beats per bar
    // 2 beat per second * 4 = 8 beats per bar
    // 4 beat per second * 4 = 16 beats per bar
    const beatsPerBar = beatsPerSecond * quarterBeatsPerBar;

    console.log(this.currentBeat, beatsPerBar);
    // Dividing the number of quarter beats by our actual beats per bar gives us
    // the length of a single beat in milliseconds.
    const beatLength = quarterBeatsPerBar / beatsPerBar;

    // console.log(beatsPerSecond, beatsPerBar, beatLength)
    // return

    const freq = this.currentBeat % beatsPerBar == 1 ? 440 : 880;
    const zero = 0.00001;

    let gainNode = this.context.createGain();
    let osc = this.context.createOscillator();
    gainNode.connect(this.context.destination);
    osc.connect(gainNode);

    gainNode.gain.exponentialRampToValueAtTime(zero, now + beatLength / 16);

    osc.frequency.value = freq;
    osc.start(now);
    osc.stop(now + beatLength);

    if (this.callback) {
      this.callback(now);
    }

    osc.onended = () => {
      this.currentBeat++;
      this.work();
    };
  };
}
