import requests
import json
import time

class VoiceApi:
    API_PATH = 'documents/config.json'
    def __init__(self):
        self.api_key = ""
        self.voice_key = ""
        with open(self.API_PATH, 'r') as file:
            content = json.load(file)
            self.api_key = content["eleven_labs_key"]
            self.voice_key = content["eleven_labs_voice"]
    
    def count_tokens(self, text):
        # change later
        return len(text)

    # message is required to be on dict {"content": "xyz"}
    def request_voice(self, message, wrap_format = True):
        url = f'https://api.elevenlabs.io/v1/text-to-speech/{self.voice_key}'
        headers = {
            'accept': 'audio/mpeg',
            'xi-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        data = {
            'text': message["content"],
            'voice_settings': {
                'stability': 0.75,
                'similarity_boost': 0.75
            }
        }
        response = requests.post(url, headers=headers, json=data, stream=True)
        if (response.status_code >= 400):
            # rise an error
            return None
        if (wrap_format):
            return {"original_message": message, "audio_response": response}
        return response
