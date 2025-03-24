import openai
import tiktoken
import json
import requests

class ChatApi:
    API_PATH = 'documents/config.json'
    def __init__(self, randomness=1, presence_penalty=0.6, max_token_size=4096):
        # m_config = config.APIKeys()
        self.randomness = randomness
        self.presence_penalty = presence_penalty
        self.MAX_TOKEN_SIZE = max_token_size
        self.api_key = ""
        with open(self.API_PATH, 'r') as file:
            content = json.load(file)
            self.api_key = content["open_ai_key"]
        openai.api_key = self.api_key

    @staticmethod
    def count_tokens(text):
        encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')
        try:
            tokens = encoding.encode(text)
            return len(tokens)
        except Exception:
            return self.MAX_TOKEN_SIZE

    def generate_response(self, message_being_sent):
        openai.api_key = self.api_key
        # response = self.chat_completion(message_being_sent, "gpt-3.5-turbo", self.randomness, 512, 1, 0, self.presence_penalty, None)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=message_being_sent,
            temperature=self.randomness,
            max_tokens=512,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=self.presence_penalty,
            stop=None
        )
        return response

    def hardcore_response(self, message_being_sent, _max_tokens):
        openai.api_key = self.api_key
        # response = self.chat_completion(message_being_sent, "gpt-3.5-turbo", 0, _max_tokens, 1, 0, 0, None)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=message_being_sent,
            temperature=0,
            max_tokens=_max_tokens,
        )
        return response

    # manually pass the api key
    def chat_completion(self, messages, model="gpt-3.5-turbo", temperature=1, max_tokens=512, top_p=1, frequency_penalty=0, presence_penalty=0.6, stop=None):
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        data = {
            'model': model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens,
            'top_p': top_p,
            'frequency_penalty': frequency_penalty,
            'presence_penalty': presence_penalty,
            'stop': stop
        }
        response = requests.post('https://api.openai.com/v1/engines/gpt-3.5-turbo/completions', headers=headers, json=data)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Request failed with status code {response.status_code}")



