import time
import copy
import re
import math
from library import concurrent_function_runner
from library import key_words_search
from library import text_evaluation

class EmotionCenter:
    def __init__(self, runner_reference):
        self.runner = runner_reference
        self.p_happy_keywords = ["joyful", "enjoyed", "cnntent","delighted","ecstatic","elated","glad","pleasant","merry","pleased","thrilled","cheerful",
        "euphoric","grateful","overjoyed","radiant","satisfied","blissful","exultant","lighthearted","upbeat"]
        self.n_sad_keywords = ["sad", "unhappy", "sorrowful", "gloomy", "downcast", "low", "depressed", "dejected", "displeased", "unsatisfied", "dissatisfied"]
        self.p_enjoyed_keywords = ["enjoy","enjoyed", "approval", "interest", "interested", "like", "likes", "satisfied"]
        self.n_disgusted_keywords = ["disgusted", "sick", "displeased", "hate", "offensive", "offended", "annoyed", "annoying"]
        self.n_angry_keywords = ["angry", "mad", "offended", "offensive"]
        self.n_jealous_keywords = ["jealous", "possessive", "needy", "clingy", "anxious", "protective"]

        self.negate_keywords = ["not", "no"]
        self.scale_up_keywords = ["so", "much", "very", "extremely"]
        self.scale_down_keywords = ["slightly", "possibly", "mildly", "little", "bit"]

        self.happiness_searcher = key_words_search.KeywordSearch(self.p_happy_keywords, self.n_sad_keywords, self.negate_keywords, self.scale_up_keywords, self.scale_down_keywords)
        self.enjoyment_searcher = key_words_search.KeywordSearch(self.p_enjoyed_keywords, self.n_disgusted_keywords, self.negate_keywords, self.scale_up_keywords, self.scale_down_keywords)
        self.madness_searcher = key_words_search.KeywordSearch(self.n_angry_keywords, [], self.negate_keywords, self.scale_up_keywords, self.scale_down_keywords)
        self.jealousy_searcher = key_words_search.KeywordSearch(self.n_jealous_keywords, [], self.negate_keywords, self.scale_up_keywords, self.scale_down_keywords)

        self.delta_message = 0
        self.margin_multiplier = 10
        self.margin_growth_rate = 1.25       # growth rate has to be greater than 0, and 1 is no growth, flat.
        self.balance_multilier = 1
        self.happiness = 0   # -100 to 100
        self.enjoyment = 0   # -100 to 100
        self.madness = 0     # 0 to 100
        self.jealousy = 0     # 0 to 100
        self.overall = 0

        self.emotion_check_runner = concurrent_function_runner.ConcurrentRunner()
        self.checked_index = -1     # no text is checked
        self.max_check_token = 512
        self.last_check_time = 0
        self.time_out_time = 10

    def checkConversationVibe(self, full_message):
        if (self.emotion_check_runner.future is None or self.emotion_check_runner.future.done()):
            check_message = self.select_check_message(full_message)
            self.emotion_check_runner.start_running(self.runner.chat_ai.hardcore_response, self.response_done, check_message, 100)
            self.last_check_time = time.time()
            return True
        elif (time.time() - self.last_check_time > self.time_out_time):
            self.emotion_check_runner.stop_running()
            check_message = self.select_check_message(full_message)
            self.emotion_check_runner.start_running(self.runner.chat_ai.hardcore_response, self.response_done, check_message, 100)
            self.last_check_time = time.time()
            return True
        return False

    def select_check_message(self, full_message):
        check_message = []
        total_tokens = 0
        self.delta_message = 0

        question_prompt = " \n\nAnalyze emotions in a conversation between sender and receiver, focusing primarily on the sender's texts while slightly considering the receiver's responses. Summarize the sender's emotions in a brief sentence: \n The conversation: \n"
        total_tokens += self.runner.chat_ai.count_tokens(question_prompt)
        index = len(full_message) - 1
        conversation = ""
        for message in reversed(full_message[1:]):
            next_line = ""
            if (message["role"] == "user"):
                next_line = "\n " + "Sender: " + message["content"]
            if (message["role"] == "assistant"):
                next_line = "\n " + "receiver: " + message["content"]
            else:
                continue
            next_line_tokens = self.runner.chat_ai.count_tokens(next_line)
            self.delta_message += next_line_tokens / 30
            if (index <= self.checked_index or total_tokens + next_line_tokens > self.max_check_token):
                break
            index -= 1
            conversation = next_line + conversation
            total_tokens += next_line_tokens
        question_prompt = conversation + question_prompt
        check_prompt = {"role": "user", "content": question_prompt}
        check_message.append(check_prompt)
        self.checked_index = len(full_message) - 1
        return check_message

    def response_done(self, ref=None, response=None):
        if (response != None):
            system_message = response["choices"][0]["message"]
            text = system_message["content"].lower()
            text = re.sub(r"[^a-zA-Z\s]", "", text)
            self.calculate_emotional(text)

    def clamp(self, num, min_v, max_v):
        return max(min(num, max_v), min_v)

    def sign(self, num):
        if num > 0:
            return 1
        elif num < 0:
            return -1
        else:
            return 0


    def calculate_emotional(self, evaluation_text):
        # print(evaluation_text)
        text_feel = text_evaluation.eval_context(evaluation_text)
        self.overall = self.clamp(self.overall + (-self.sign(self.overall) * self.balance_multilier * self.delta_message) + (text_feel * self.margin_multiplier * self.delta_message), -100, 100)
        print(self.overall)
        self.delta_message = 0

    def assign_adjective(self, value, tier1, tier2, tier3):
        if (value > tier1):
            return "significantly"
        elif (value > tier2):
            return "moderately"
        elif (value > tier3):
            return "slightly"
        return ""

    def get_emotion_description(self):
        emotion_prompt = "Your current emotion is "
        if (self.overall > 25):
            emotion_prompt += self.assign_adjective(self.overall, 75, 50, 25) + " on positive and happy side."
        elif (self.overall < -25):
            emotion_prompt += self.assign_adjective(-self.overall, 75, 50, 25) + " negative."
        else:
            return ""
        return emotion_prompt

