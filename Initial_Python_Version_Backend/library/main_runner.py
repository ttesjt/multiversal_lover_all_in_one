import time
import math
from api import openai_api
from api import text_to_voice_api
from library import data_stream
from library import states_triggers
from library import chat_status
from library import chat_core
from library import emotion_center
from library import relationship_progress_growth
from library import natural_chat
from library import text_to_voice
from library import auto_follow_up


class MainRunner:
    DAY_MAX_PROGRESS = 100.0
    def __init__(self, id = "000000000000"):
        self.relation_data = {}
        self.chat_ai = openai_api.ChatApi()
        self.voice_ai = text_to_voice_api.VoiceApi()
        self.states = states_triggers.StatesTriggers(self)
        self.m_data_stream = data_stream.DataLoader()
        self.m_chat_status = chat_status.ChatStatus()
        self.m_voicer = text_to_voice.VoiceProducer(self)
        self.m_relationship_growth = relationship_progress_growth.RelationshipProgressGrowth()

        self.prompts_set_up()
        self.start()

        self.m_chat_core = chat_core.ChatCore(self)
        self.m_natural_chat = natural_chat.NaturalChatFlowController(self)
        self.m_emotion = emotion_center.EmotionCenter(self)
        self.m_auto_follow_up = auto_follow_up.AutoFollowUp(self)

        self.chat_start_time = 0
        self.last_record_time = 0
        self.unstored_messages = []

    def prompts_set_up(self):
        self.relationTiers = self.m_data_stream.load_tiers()
        self.AICharacterData = self.m_data_stream.load_ai()
        self.UserCharacterData = self.m_data_stream.load_user()
        self.relation_data = self.m_data_stream.load_relation_progress()
        first_date = False
        if self.relation_data["total_dating_seconds"] == 0:
            self.first_date()
            first_date = True

        self.AIName = self.AICharacterData['name']
        self.AICharacterRequirement = self.AICharacterData['requirements'] + "\n"
        self.AICharacterDefinition = "\n Your' name is " + self.AICharacterData["name"]
        if (self.AICharacterData["origin"] != ""):
            self.AICharacterDefinition += " from " + self.AICharacterData["origin"] + ". Emobody her personality and background"
        self.AICharacterDefinition += ". " + self.AICharacterData['name'] + " has a " + self.AICharacterData["personality"] + " personality" + ". " + self.AICharacterData["extraNote"] + "You like to " + self.AICharacterData["chatStyle"]

        time_since_first_date = time.time() - self.relation_data["first_date"]
        time_since_last_date = time.time() - self.relation_data["last_data_time"]
        self.dating_progress = "\n\nYou have been dating with user for " + str(self.unix_to_days(time_since_first_date)) + " days. "
        self.dating_progress += "You two have sent " + str((int)(self.relation_data["total_dating_seconds"]/60)) + " minutes together. "
        if (not first_date):
            self.dating_progress += "The last time you dated with user was " + str(self.days_to_string(self.unix_to_days(time_since_last_date)))
        else:
            self.dating_progress += "This is the first date with user"

        self.AICharacterPrompt = self.AICharacterRequirement + self.AICharacterDefinition + self.dating_progress
        self.UserName = self.UserCharacterData['name']
        self.UserCharacterDefinition = self.UserCharacterData['character']

    def start(self):
        self.chat_start_time = time.time()
        self.last_record_time = time.time()
        self.unstored_messages = []
        self.process_relation_data()

    def update(self):
        out = {"new_message": None, "new_voice_message": None, "new_audio_response": None}
        new_text_message = self.m_chat_core.update() # new_text_message {"message": xyz, "start_time": time}
        new_voice_response = self.m_voicer.update()
        if (new_text_message != None):
            # audio file or not, this is a format of text, so call on text_response to post process the output
            # some of them might manipulate the new_text_message["message"]. **Note that the manipulation is manually controlled to avoid "change-fight"**
            self.states.on_text_response_given(new_text_message["message"])
            if (self.m_chat_status.voice_on):
                self.m_voicer.send_text_to_voice_request(new_text_message["message"], new_text_message["start_time"])  # send the entire message object to keep the reference for later response
                # no matter, if we want the text to be displayed, we will wait until the voice is ready, so remove this message to be displayed
                out["new_message"] = None
                # if voice is enabled, then we gonna store this after the voice is ready
                self.m_chat_core.remove_message(new_text_message["message"])
            else:
                self.unstored_messages.append(new_text_message["message"])
                # add the possibly manipulated response back
                out["new_message"] = new_text_message["message"]
        if (new_voice_response != None):
            self.m_chat_core.messages.append(new_voice_response["original_message"])
            self.unstored_messages.append(new_voice_response["original_message"])
            # self.states.on_text_response_given(new_voice_response["original_message"]) <- did in new_text_message. processed before transfered to audio
            out["new_voice_message"] = new_voice_response["original_message"]
            out["new_audio_response"] = new_voice_response["audio_response"]
        # self.m_natural_chat.update()
        return out

    def user_input(self, text):
        input_message = {"role": "user", "content": text}
        self.states.on_text_input_given(input_message)
        self.unstored_messages.append(input_message)
        self.m_chat_core.chatWithGpt(input_message)
        # self.states.on_chat_sent()

    def chat_end(self):
        # chat_duration = time.time() - self.chat_start_time
        self.record_the_progress(True)

    # this method will add prompt to the chat history but do not generate a response
    def add_system_prompt_to_message(text):
        self.m_chat_core.messages.append({"role":"system", "content":text})

    # is used to ask for some *RESPONSE* for system use from chat ai or ask chat ai to print something on to the messages
    def system_prompt(self, text, max_token, request_func, **kwargs):
        prompt_tokens = self.chat_ai.count_tokens(text)

        role = kwargs.get('role')
        if (role == None): role = "system"
        include_base_prompts = kwargs.get('include_base_prompts')
        responde_as_chat = kwargs.get('responde_as_chat')
        is_sole = kwargs.get('is_sole')
        if (is_sole == None): is_sole = False
        # callback have to take two arg: (reference = None, response = None)
        callback_func = kwargs.get('callback_func')

        if (include_base_prompts):
            prompt_tokens += self.chat_ai.count_tokens(self.AICharacterPrompt)
        messages_to_send = self.m_chat_core.select_messages_from_bottom(self.m_chat_core.messages, max_token - prompt_tokens)
        if (include_base_prompts):
            messages_to_send.insert(0, {"role": role, "content": self.AICharacterPrompt})
        messages_to_send.append({"role": role, "content": text})
        if (responde_as_chat):
            # send chat via chat_core' thread so it will be returned as a message
            return self.m_chat_core.c_chat.start_request_response(messages_to_send, request_func, is_sole)
        else:
            new_request = concurrent_function_runner.ConcurrentRunner()
            new_request.start_running(request_func, callback_func, messages_to_send)
            return new_request

    def process_relation_data(self):
        self.disconnect_days = self.unix_to_days(time.time() - self.relation_data["last_data_time"])
        self.record_the_progress(False)

    def record_the_progress(self, proper_end = False):
        self.relation_data["last_data_time"] = time.time()
        self.relation_data["total_dating_seconds"] += (time.time() - self.last_record_time)
        self.relation_data["number_of_messages"] += len(self.unstored_messages)
        self.relation_data["relation_prograss"] += self.m_relationship_growth.collect_increment()
        self.relation_data["events_finished"] = 0
        if (proper_end):
            self.relation_data["proper_ended_chat"] = "True"
        else:
            self.relation_data["proper_ended_chat"] = "False"
        self.m_data_stream.write_relation_progress(self.relation_data)
        self.unstored_messages = []
        self.last_record_time = time.time()

    def first_date(self):
        self.relation_data["first_date"] = time.time()
        self.relation_data["total_dating_seconds"] = 1
        self.relation_data["last_data_time"] = time.time()

    @staticmethod
    def relation_level_to_string(relation_level):
        if (relation_level < 200):
            return "You two just start the relationship. You are ready for the exciting future."
        elif (relation_level < 700):
            return "You now have a stable connection with the user. You two can synchronize well."
        else:
            return "You now have a very stable and close relationship with the user. You two are not separable"

    @staticmethod
    def unix_to_days(seconds):
        seconds_in_a_day = 86400
        return (int)(seconds / seconds_in_a_day)

    @staticmethod
    def days_to_string(days):
        if (days == 0):
            return "earlier today."
        elif (days == 1):
            return "yesterday."
        else:
            return days + " days ago."


