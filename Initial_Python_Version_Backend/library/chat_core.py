import time
import random
from library import concurrent_functions_organizer

class ChatCore:
    def __init__(self, runner_reference):
        self.runner = runner_reference
        self.c_chat = concurrent_functions_organizer.ConcurrentOrgnizerForMessages()

        self.emotion_count = 3
        self.preregistered_lines = 1

        self.messages = []
        self.messages.insert(0, {"role": "system", "content": self.runner.AICharacterPrompt})
        self.emotion_prompt = ""
        self.last_get_message_time = -100
        self.min_message_interval_range = [1, 1.4]
        self.min_message_interval = 1

    def update(self):
        self.emotion_prompt = self.runner.m_emotion.get_emotion_description()
        return self.process_one_new_message()

    # remove a certain message by reference. Can use the reference returned by update
    def remove_message(self, message):
        self.messages.remove(message)

    def calculate_allowed_token(self, text):
        return 1000

    def selectiveText(self, max_token_allowed):
        message_being_sent = []
        total_tokens = 0
        insert_point = self.preregistered_lines

        for i in range(self.preregistered_lines):
            message_being_sent.append(self.messages[i])
            total_tokens += self.runner.chat_ai.count_tokens(self.messages[i]["content"])

        if (self.emotion_prompt != ""):
            total_tokens += self.runner.chat_ai.count_tokens(self.emotion_prompt)
            print(self.emotion_prompt)
            message_being_sent.append({"role": "system", "content": self.emotion_prompt})
            insert_point += 1

        index = len(self.messages) - 1
        for message in reversed(self.messages[1:]):
            message_tokens = self.runner.chat_ai.count_tokens(message["content"])
            if (index < self.preregistered_lines):
                break
            if total_tokens + message_tokens > max_token_allowed:
                break
            index -= 1
            message_being_sent.insert(insert_point, message)
            total_tokens += message_tokens

        return message_being_sent

    def select_messages_from_bottom(self, pass_messages, max_token_allowed):
        message_being_sent = []
        total_tokens = 0
        for message in reversed(pass_messages):
            message_tokens = self.runner.chat_ai.count_tokens(message["content"])
            if (total_tokens + message_tokens) > max_token_allowed:
                break
            message_being_sent.insert(0, message)
            total_tokens += message_tokens
        return message_being_sent

    def chatWithGpt(self, message):
        self.messages.append(message)
        startTime = time.time()
        timeLimit = 20
        message_being_sent = self.selectiveText(self.calculate_allowed_token(message["content"]))
        self.emotion_count -= 1
        if (self.emotion_count <= 0):
            emotion_sent = self.runner.m_emotion.checkConversationVibe(self.messages)
            if (emotion_sent == True):
                self.emotion_count = 3

        if (not self.runner.m_chat_status.is_away):
            self.c_chat.start_request_response(message_being_sent, self.runner.chat_ai.generate_response)
        self.runner.m_natural_chat.user_sent_a_message()

    def system_prompt(self, text, max_token, request_func, include_base_prompts=True, responde_as_chat=True, is_sole=False):
        prompt_tokens = self.runner.chat_ai.count_tokens(text)

        if (include_base_prompts):
            prompt_tokens += self.runner.chat_ai.count_tokens(self.runner.AICharacterPrompt)
        messages_to_send = self.select_messages_from_bottom(self.messages, max_token - prompt_tokens)

        if (include_base_prompts):
            messages_to_send.insert(0, {"role": "system", "content": self.runner.AICharacterPrompt})
        messages_to_send.append({"role": "system", "content": text})

        if (responde_as_chat):
            return self.c_chat.start_request_response(messages_to_send, request_func, is_sole)
        else:
            new_request = concurrent_function_runner.ConcurrentRunner()
            new_request.start_running(request_func, None, messages_to_send)
            return new_request

    def wrap_response(self, response):
        return {"role": response["choices"][0]["message"]["role"], "content": response["choices"][0]["message"]["content"]}

    def process_one_new_message(self):
        if (time.time() - self.last_get_message_time >= self.min_message_interval):
            self.min_message_interval = random.uniform(self.min_message_interval_range[0], self.min_message_interval_range[1])
            new_response = self.c_chat.get_response(True, False)            # ==> {"response": response_obj, "start_time": xyz}
            if (new_response != None):
                self.last_get_message_time = time.time()
                new_message = self.wrap_response(new_response["response"])  # wrap original object to a new object and keep a reference
                self.messages.append(new_message)
                return {"message": new_message, "start_time": new_response["start_time"]}
        return None

    def process_all_new_messages_to_string(self, return_all=False):
        new_responses = self.c_chat.get_response(False, True)
        if (len(new_responses) > 0):
            new_messages = []
            for item in new_responses:
                self.messages.append(self.wrap_response(item))
                new_messages.append(self.wrap_response(item))
            if (not return_all):
                return self.return_messages(new_messages)
        if (return_all):
            return self.return_messages(self.messages)
        return ""

    def process_one_new_messages_to_string(self, return_all=False):
        if (time.time() - self.last_get_message_time >= self.min_message_interval):
            new_response = self.c_chat.get_response(False, False)
            if (new_response != None):
                self.last_get_message_time = time.time()
                new_message = self.wrap_response(new_response)
                self.messages.append(new_message)
                if (not return_all):
                    return self.return_a_message(new_message)
        if (return_all):
            return self.return_messages(self.messages)
        return ""

    def return_a_message(self, return_message):
        chat_transcript = ""
        if return_message['role'] == 'user':
            chat_transcript += self.UserName + ": " + return_message['content'] + "\n\n"
        elif return_message['role'] == 'assistant':
            chat_transcript += self.AIName + ": " + return_message['content'] + "\n\n"
        return chat_transcript

    def return_messages(self, messages_list):
        chat_transcript = ""
        for message in messages_list:
            if message['role'] == 'user':
                chat_transcript += self.UserName + ": " + message['content'] + "\n\n"
            elif message['role'] == 'assistant':
                chat_transcript += self.AIName + ": " + message['content'] + "\n\n"
        return chat_transcript

    def set_user_name(self, new_name):
        self.UserName = new_name

    def set_ai_name(self, new_name):
        self.AIName = new_name

    def get_all_chat(self):
        return self.return_messages(self.messages)

    def get_ai_name(self):
        return self.AIName

    def get_user_name(self):
        return self.UserName
