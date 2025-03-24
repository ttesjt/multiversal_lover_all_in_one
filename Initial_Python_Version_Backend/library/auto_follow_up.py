
import time
import random
class AutoFollowUp:
    def __init__(self,runner_reference):
        self.runner=runner_reference
        self.chat_interval=10
        self.runner.states.add_to_on_text_response_given(self.update)

    def initial(self):
        self.chat_interval=random.randint(5,15)
    def set_chatinterval(self):
        self.chat_interval=random.randint(5,15)

    def update(self,message):
        #Which means we need to continue this conversation
        if random.randint(0,5)==10:
            self.auto_follow_up()
            self.chat_interval=self.set_chatinterval()

    def auto_follow_up(self):
        temp_sty = "continue the conversation in " + str(random.randint(3, 12)) + " words." 
        self.runner.system_prompt(temp_sty, 1000, self.runner.chat_ai.generate_response, include_base_prompts = False, responde_as_chat = True)
        