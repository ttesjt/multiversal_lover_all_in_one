import time

class ChatStatus:
    def __init__(self):
        self.is_away = False
        self.voice_on = False
        self.current_mood = "Neutral"
        self.chat_duration = 0
        self.last_user_input_time = 0
        self.last_user_input_change_time = 0

    def user_input_is_given(self):
        self.last_user_input_time = time.time()

    def user_input_is_changed(self):
        self.last_user_input_change_time = time.time()

    def get_last_input_time_diff(self):
        return time.time() - self.last_user_input_time

    def get_last_input_change_time_diff(self):
        return time.time() - self.last_user_input_change_time

    def set_away(self, away):
        self.is_away = away

    def initialization(self):
        self.is_away = False
        self.current_mood = "Neutral"
        self.chat_duration = 0

