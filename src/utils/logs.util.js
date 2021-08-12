export function DebugOrLog(textToLog) {
  if (DEBUG) {
    var millis = Date.now() - start; // we get the ms ellapsed from the start of the test
    var time = Math.floor(millis / 1000); // in seconds
    // console.log(`${time}se: ${textToLog}`); // se = Seconds elapsed
    console.log(`${textToLog}`);
  }
}
