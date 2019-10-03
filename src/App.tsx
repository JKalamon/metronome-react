import React from "react";
import Slider from "react-input-slider";
import "./App.scss";
import { MessyMetronome } from "./metronome";
import { AudioContextHelper } from "./worker-metronome/audio-context-monkey-patch";

export class App extends React.Component<{}, { x: number; beat: number }> {
  metronome: MessyMetronome;
  constructor(props: any) {
    super(props);
    this.state = { x: 120, beat: 0 };
    AudioContextHelper.initializeAudioContext();
    this.metronome = new MessyMetronome();
  }

  render() {
    return (
      <div className="App">
        <div className="logo">
          <h1>Web metronome</h1>
          <h3>by MrBubel</h3>
        </div>

        <div className="bpm-header">
          <span className="bpm-value">{this.state.x}</span>
          <span className="bpm-label">BPM</span>
        </div>
        <div className="slider-wrapper">
          <div className="btn-wrapper">
            <div
              className="btn-round"
              onClick={() => this.setState({ x: this.state.x - 1 })}
            >
              <span>-</span>
            </div>
          </div>
          <Slider
            axis="x"
            styles={{
              active: {
                backgroundColor: "#1768AC"
              }
            }}
            xstep={1}
            xmin={20}
            xmax={200}
            x={this.state.x}
            onChange={(result: { x: number; y: number }) => {
              this.setState({ x: parseFloat(result.x.toFixed(2)) });
            }}
          />
          <div className="btn-wrapper">
            <div className="btn-round">
              <span>+</span>
            </div>
          </div>
        </div>
        {this.metronome.isWorking ? <div className="btn" onClick={this.stop}>Stop</div> : <div className="btn" onClick={this.start}>Start</div>}
        
        {this.state.beat}
      </div>
    );
  }

  start = () => {
    this.metronome.bpm = this.state.x;
    this.metronome.callback = this.changeBeat;
    this.metronome.start();
  }

  changeBeat = (beat: number) => {
    this.setState({ beat: beat });
  };

  stop = () => {
    this.metronome.stop();
  }
}

export default App;
