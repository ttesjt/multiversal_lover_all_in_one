import time

class StatesTriggers:
    def __init__(self, runner_reference):
        self.runner = runner_reference
        self.on_text_input_given_func = []
        # self.on_chat_sent_func = []
        self.on_text_response_given_func = []
        self.on_input_change_func = []
        self.on_ai_away_func = []

    def on_text_input_given(self, input_message):
        for func in self.on_text_input_given_func:
            func(input_message)

    # functions must accept a arg of message_type {"role": "assistant", "content": "xyz"} or None
    def add_to_on_text_input_given(self, new_function):
        self.on_text_input_given_func.append(new_function)

    def on_text_response_given(self, output_message):
        for func in self.on_text_response_given_func:
            func(output_message)

    # on response given' functions must accept a arg of message_type {"role": "assistant", "content": "xyz"} or **None**, in case some other list memeber manipulated the message
    def add_to_on_text_response_given(self, new_function):
        self.on_text_response_given_func.append(new_function)

    def on_input_change(self):
        for func in self.on_input_change_func:
            func()

    def add_to_on_input_change(self, new_function):
        self.on_input_change_func.append(new_function)

    def on_ai_away(self):
        for func in self.on_ai_away_func:
            func()

    def add_to_on_ai_away(self, new_function):
        self.on_ai_away_func.append(new_function)
    
    """
    def on_chat_sent(self):
        for func in self.on_chat_sent_func:
            func()

    def add_to_on_chat_sent(self, new_function):
        self.on_chat_sent_func.append(new_function)
    """