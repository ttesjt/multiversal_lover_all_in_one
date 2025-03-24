import { ConcurrentOrgnizer } from './concurrent_runner.js';

export class VoiceProducer {
  constructor(runnerReference) {
    this.runner = runnerReference;
    this.cVoice = new ConcurrentOrgnizer();
  }

  update() {
    return this.tryGetVoiceResponse();
  }

  // requestContent is required to be in format {"content":"xyz", ....}
  sendTextToVoiceRequest(requestContent, startTime = 0) {
    if (startTime === 0) {
      startTime = Date.now() / 1000;
    }
    return this.cVoice.startRequestResponseCustomizedStartTime(requestContent, this.runner.voiceAi.requestVoice.bind(this.runner.voiceAi.requestVoice), startTime, false); // change the request func
  }

  tryGetVoiceResponse() {
    return this.cVoice.getResponse(false);
  }
}