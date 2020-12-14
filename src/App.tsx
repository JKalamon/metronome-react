import React from "react";
import Slider from "react-input-slider";
import "./App.scss";
import { Metronome } from "./worker-metronome/metronome";

interface AppState {
  bmp: number;
  currentBeat: number;
  isPlaying: boolean;
  enableAudio: boolean;
  currentColor: number;
}

export class App extends React.Component<{}, AppState> {
  metronome: Metronome;
  colorsArray = Array.from(Array(20).keys());
  constructor(props: any) {
    super(props);
    this.state = { bmp: 120, currentBeat: 0, isPlaying: false, enableAudio: true, currentColor: 0 };
    this.metronome = new Metronome();    
  }

  render() {
    return (
      <div className={`App ${this.state.isPlaying ? `color${this.state.currentColor}-${this.state.currentBeat}` : ''}`}>
        <div className="logo">
          <h1>Web metronome</h1>
          <h3>by MrBubel</h3>
        </div>
        <div className="options">
          <input id="enableAudio" type="checkbox" checked={this.state.enableAudio} onChange={e => this.setState({enableAudio : e.target.checked})}></input>
          <label htmlFor="enableAudio">enable audio</label>
          <p>Background color:</p>
          <div className="colors-wrapper">
            {this.colorsArray.map(color => {
              return <div className={`square color${color}-0 ${this.state.currentColor === color ? 'selected': ''}`} onClick={() => this.setState({currentColor: color})} key={color}></div>
            })}
          </div>
        </div>
        <div className="bpm-header">
          <span className="bpm-value">{this.state.bmp}</span>
          <span className="bpm-label">BPM</span>
        </div>
        <div className="slider-wrapper">
          <div className="btn-wrapper">
            <div
              className="btn-round"
              onClick={() => this.setState({ bmp: this.state.bmp - 1 })}
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
            x={this.state.bmp}
            onChange={(result: { x: number; y: number }) => {
              this.setState({ bmp: parseFloat(result.x.toFixed(2)) });
            }}
          />
          <div className="btn-wrapper">
            <div className="btn-round"
            onClick={() => this.setState({ bmp: this.state.bmp + 1 })}>
              <span>+</span>
            </div>
          </div>
        </div>
        {this.state.isPlaying ? (
          <div className="btn" onClick={this.stop}>
            Stop
          </div>
        ) : (
          <div className="btn" onClick={this.start}>
            Start
          </div>
        )}

        <div className="circle-wrapper">
          {[0, 1, 2, 3].map(element => {
            return (
              <div
                className={`circle ${element === this.state.currentBeat ? "selected" : ""}`}
              ></div>
            );
          })}
        </div>
      </div>
    );
  }

  start = () => {    
    this.setState({ isPlaying: true });
    this.metronome.callback = this.changeBeat;
    this.metronome.tempo = this.state.bmp;
    this.metronome.enableAudio = this.state.enableAudio;
    this.metronome.playOrStop();
  };

  changeBeat = (beat: number) => {
    this.setState({ currentBeat: beat });
  };

  stop = () => {
    this.metronome.playOrStop();
    this.setState({ isPlaying: false });
  };
}

export default App;
