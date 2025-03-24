import utility

import sys
sys.path.append("./packages")

import openai
import tiktoken
import json
import requests

class ChatApi:
    API_PATH = 'documents/config.json'
    def __init__(self, randomness=1, presence_penalty=0.6, messages_max_token=1500):
        # m_config = config.APIKeys()
        self.randomness = randomness
        self.presence_penalty = presence_penalty
        self.messages_max_token = messages_max_token
        self.api_key = ""
        self.default_api_key = ""
        with open(self.API_PATH, 'r') as file:
            content = json.load(file)
            self.api_key = content["open_ai_key"]
            self.default_api_key = content["open_ai_key"]
        openai.api_key = self.api_key
        self.message_clamper = utility.MessageClamping(self.count_tokens)

    def assign_api_key(self, new_api_key = ""):
        if (new_api_key == ""):
            new_api_key = self.default_api_key
        self.api_key = new_api_key
        openai.api_key = new_api_key

    def get_current_api_key(self):
        return openai.api_key

    @staticmethod
    def count_tokens(text):
        encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')
        try:
            tokens = encoding.encode(text)
            return len(tokens)
        except Exception:
            return self.messages_max_token

    def request_normal(self, request, chat_history):
        messages = request["message_list"]
        pre_lines = request["pre_lines"]
        after_lines = request["after_lines"]
        token_limit = request["token_limit"]
        break_response = request["break_response"]

        (message_being_sent, total_tokens) = self.message_clamper.insert_more_messages_to_messages(messages, chat_history, token_limit, pre_lines, after_lines)
        print(message_being_sent)
        openai.api_key = self.api_key
        # response = self.chat_completion(message_being_sent, "gpt-3.5-turbo", self.randomness, 512, 1, 0, self.presence_penalty, None)
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=message_being_sent,
                temperature=self.randomness,
                max_tokens=1024,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=self.presence_penalty,
                stop=None
            )
            response["choices"][0]["tokens_spent"] = total_tokens
            return response
        except Exception as e:
            # Handle other exceptions
            return "faild"

    # set max_token equal to 0 to get ride of all the body messages
    def request_hard(self, request, chat_history):
        messages = request["message_list"]
        pre_lines = request["pre_lines"]
        after_lines = request["after_lines"]
        token_limit = request["token_limit"]
        break_response = request["break_response"]

        (message_being_sent, total_tokens) = self.message_clamper.insert_more_messages_to_messages(messages, chat_history, token_limit, pre_lines, after_lines)
        openai.api_key = self.api_key
        # response = self.chat_completion(message_being_sent, "gpt-3.5-turbo", 0, _max_tokens, 1, 0, 0, None)
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=message_being_sent,
                temperature=0,
                max_tokens=1024,
            )
            response["choices"][0]["tokens_spent"] = total_tokens
            return response
        except Exception as e:
            # Handle other exceptions
            return "faild"


