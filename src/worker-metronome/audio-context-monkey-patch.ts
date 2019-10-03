/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/*

This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext),
and that use the new naming and proper bits of the Web Audio API (e.g.
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.

This library should be harmless to include if the browser supports
unprefixed "AudioContext", and/or if it supports the new names.

The patches this library handles:
if window.AudioContext is unsupported, it will be aliased to webkitAudioContext().
if AudioBufferSourceNode.start() is unimplemented, it will be routed to noteOn() or
noteGrainOn(), depending on parameters.

The following aliases only take effect if the new names are not already in place:

AudioBufferSourceNode.stop() is aliased to noteOff()
AudioContext.createGain() is aliased to createGainNode()
AudioContext.createDelay() is aliased to createDelayNode()
AudioContext.createScriptProcessor() is aliased to createJavaScriptNode()
AudioContext.createPeriodicWave() is aliased to createWaveTable()
OscillatorNode.start() is aliased to noteOn()
OscillatorNode.stop() is aliased to noteOff()
OscillatorNode.setPeriodicWave() is aliased to setWaveTable()
AudioParam.setTargetAtTime() is aliased to setTargetValueAtTime()

This library does NOT patch the enumerated type changes, as it is
recommended in the specification that implementations support both integer
and string types for AudioPannerNode.panningModel, AudioPannerNode.distanceModel
BiquadFilterNode.type and OscillatorNode.type.

*/

export class AudioContextHelper {

  public static fixSetTarget = (param: any) => {
    if (!param) {
      return;
    }

    if (!param.setTargetAtTime) {
      param.setTargetAtTime = param.setTargetValueAtTime;
    }
  }

  public static initializeAudioContext() {
    let windowAsAny = window as any;
    const functionMapping = [
      { resultFunctionName: 'createGain', sourceFunctionName: 'createGainNode' },
      { resultFunctionName: 'createDelay', sourceFunctionName: 'createDelayNode' },
      { resultFunctionName: 'createScriptProcessor', sourceFunctionName: 'createJavaScriptNode' },
      { resultFunctionName: 'createPeriodicWave', sourceFunctionName: 'createWaveTable' },
    ]

    if (window.hasOwnProperty('webkitAudioContext') && !window.hasOwnProperty('AudioContext')) {
      window.AudioContext = windowAsAny['webkitAudioContext'];
      let audioContextPrototype = window.AudioContext.prototype as any;

      functionMapping.forEach(x => {
        if (!audioContextPrototype.hasOwnProperty(x.resultFunctionName)) {
          audioContextPrototype[x.resultFunctionName] = audioContextPrototype[x.sourceFunctionName];
        }
      });

      audioContextPrototype.internal_createGain = audioContextPrototype.createGain;
      audioContextPrototype.createGain = function () {
        let node = this.internal_createGain();
        AudioContextHelper.fixSetTarget(node.gain);
        return node;
      };

      audioContextPrototype.internal_createDelay = audioContextPrototype.createDelay;
      audioContextPrototype.createDelay = function (maxDelayTime: number) {
        var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
        AudioContextHelper.fixSetTarget(node.delayTime);
        return node;
      };

      audioContextPrototype.internal_createBufferSource = audioContextPrototype.createBufferSource;
      audioContextPrototype.createBufferSource = function () {
        var node = this.internal_createBufferSource();
        if (!node.start) {
          node.start = function (when: number, offset: number, duration: number) {
            if (offset || duration)
              this.noteGrainOn(when || 0, offset, duration);
            else
              this.noteOn(when || 0);
          };
        } else {
          node.internal_start = node.start;
          node.start = function (when: number, offset: number, duration: number) {
            if (typeof duration !== 'undefined')
              node.internal_start(when || 0, offset, duration);
            else
              node.internal_start(when || 0, offset || 0);
          };
        }
        if (!node.stop) {
          node.stop = function (when: number) {
            this.noteOff(when || 0);
          };
        } else {
          node.internal_stop = node.stop;
          node.stop = function (when: number) {
            node.internal_stop(when || 0);
          };
        }

        AudioContextHelper.fixSetTarget(node.playbackRate);
        return node;
      };

      audioContextPrototype.internal_createDynamicsCompressor = audioContextPrototype.createDynamicsCompressor;
      audioContextPrototype.createDynamicsCompressor = function () {
        var node = this.internal_createDynamicsCompressor();
        AudioContextHelper.fixSetTarget(node.threshold);
        AudioContextHelper.fixSetTarget(node.knee);
        AudioContextHelper.fixSetTarget(node.ratio);
        AudioContextHelper.fixSetTarget(node.reduction);
        AudioContextHelper.fixSetTarget(node.attack);
        AudioContextHelper.fixSetTarget(node.release);
        return node;
      };

      audioContextPrototype.internal_createBiquadFilter = audioContextPrototype.createBiquadFilter;
      audioContextPrototype.createBiquadFilter = function () {
        var node = this.internal_createBiquadFilter();
        AudioContextHelper.fixSetTarget(node.frequency);
        AudioContextHelper.fixSetTarget(node.detune);
        AudioContextHelper.fixSetTarget(node.Q);
        AudioContextHelper.fixSetTarget(node.gain);
        return node;
      };

      if (audioContextPrototype.hasOwnProperty('createOscillator')) {
        audioContextPrototype.internal_createOscillator = audioContextPrototype.createOscillator;
        audioContextPrototype.createOscillator = function () {
          var node = this.internal_createOscillator();
          if (!node.start) {
            node.start = function (when: number) {
              this.noteOn(when || 0);
            };
          } else {
            node.internal_start = node.start;
            node.start = function (when: number) {
              node.internal_start(when || 0);
            };
          }
          if (!node.stop) {
            node.stop = function (when: number) {
              this.noteOff(when || 0);
            };
          } else {
            node.internal_stop = node.stop;
            node.stop = function (when: number) {
              node.internal_stop(when || 0);
            };
          }

          if (!node.setPeriodicWave) {
            node.setPeriodicWave = node.setWaveTable;
          }

          AudioContextHelper.fixSetTarget(node.frequency);
          AudioContextHelper.fixSetTarget(node.detune);
          return node;
        };
      }
    }

    if (windowAsAny.hasOwnProperty('webkitOfflineAudioContext') && !windowAsAny.hasOwnProperty('OfflineAudioContext')) {
      windowAsAny.OfflineAudioContext = windowAsAny.webkitOfflineAudioContext;
    }
  }
}
