export class MetronomeWorker {
  public static worker = () => {
    var xx = { self: null };
/* eslint-disable */
    const ctx: Worker = self as any;

    var timerID: NodeJS.Timeout | null = null;
    var interval = 100;

    /* eslint-disable */
    self.onmessage = function(e: any) {
      if (e.data == "start") {
        console.log("starting");
        timerID = setInterval(function() {
          ctx.postMessage("tick");
        }, interval);
      } else if (e.data.interval) {
        console.log("setting interval");
        interval = e.data.interval;
        console.log("interval=" + interval);
        if (timerID) {
          clearInterval(timerID);
          timerID = setInterval(function() {
            ctx.postMessage("tick");
          }, interval);
        }
      } else if (e.data == "stop") {
        console.log("stopping");
        if (timerID) {
          clearInterval(timerID);
        }

        timerID = null;
      }
    };

    ctx.postMessage("hi there");
  };
}
