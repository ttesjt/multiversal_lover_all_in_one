import time
import random
from library import events_system

class NaturalChatFlowController:
    def __init__(self, runner_reference):
        self.runner = runner_reference
        self.e_system = events_system.EventsSystem(runner_reference)
        self.try_response_1 = False
        self.try_response_2 = False
        self.try_response_3 = False
        self.last_user_input_time = time.time()
        self.last_random_sty_time = time.time()
        self.story_continue_num = 0

    def inital(self):
        self.try_response_1 = False
        self.try_response_2 = False
        self.try_response_3 = False
        self.last_user_input_time = time.time()
        self.last_random_sty_time = time.time()

    def update(self):
        answer_len = random.randint(5, 20)
        story_flag = random.randint(0, 100)

        if self.story_continue_num >= 5:
            print('Enter this reset story continue num function')
            self.story_continue_num = 0

        if time.time() - self.last_user_input_time > 250 and self.try_response_2 and self.try_response_3 == False:
            print("The player is there 3", answer_len)
            self.try_response_3 = True
            temptext = "Generate a message that assumes the user is busy and expresses a reluctant sentiment to end the conversation, while still being open to continuing the chat in the context of a dating bot in " + str(answer_len) + " words"
            self.runner.m_chat_core.system_prompt(temptext, 1000, self.runner.chat_ai.generate_response)

        elif time.time() - self.last_user_input_time > 200 and self.try_response_1 and self.try_response_2 == False:
            print("The player is there 2", answer_len)
            self.try_response_2 = True
            temptext = "Generate an engaging and slightly urgent message to check if the user is still online and encourage them to respond in the context of a dating bot conversation in " + str(answer_len) + " words"
            self.runner.m_chat_core.system_prompt(temptext, 1000, self.runner.chat_ai.generate_response)

        elif time.time() - self.last_user_input_time > 120 and self.try_response_1 == False:
            print("The player is there 1", answer_len)
            self.try_response_1 = True
            temptext = "Generate an engaging message to check if the user is still online in " + str(answer_len) + " words"
            self.runner.m_chat_core.system_prompt(temptext, 1000, self.runner.chat_ai.generate_response)

        elif story_flag % 100 == 5 and time.time() - self.last_random_sty_time > 10 and self.story_continue_num == 0:
            self.story_generate()
            self.last_random_sty_time = time.time()
            self.story_continue_num += 1

        elif story_flag % 30 == 5 and time.time() - self.last_random_sty_time > 10 and self.story_continue_num < 5 and self.story_continue_num > 0:
            print(self.story_continue_num)
            self.story_continue()
            self.last_random_sty_time = time.time()
            self.story_continue_num += 1

    def story_generate(self):
        temp_sty = "Suddenly some event happens, you want to invite the user to finish this event with you, here is the event: " + self.e_system.generate_random()
        self.runner.m_chat_core.chatWithGpt(temp_sty)

    def story_continue(self):
        temp_sty = "Continue this event"
        self.runner.m_chat_core.chatWithGpt(temp_sty)

    def user_sent_a_message(self):
        self.inital()



