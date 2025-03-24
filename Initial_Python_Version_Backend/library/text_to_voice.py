from library import concurrent_functions_organizer
import time

class VoiceProducer:
    def __init__(self, runner_reference):
        self.runner = runner_reference
        self.c_voice = concurrent_functions_organizer.ConcurrentOrgnizer()
    
    def update(self):
        return self.try_get_voice_response()

    # request_content is required to be in format {"content":"xyz", ....}
    def send_text_to_voice_request(self, request_content, start_time = 0):
        if start_time == 0:
            start_time = time.time()
        return self.c_voice.start_request_response_customized_start_time(request_content, self.runner.voice_ai.request_voice, start_time, sole_exist=False) # change the request func
    
    def try_get_voice_response(self):
        return self.c_voice.get_response(False)
