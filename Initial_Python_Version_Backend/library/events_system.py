import random

class EventsSystem:
    def __init__(self, runner_reference):
        self.runner = runner_reference
        self.story_prompt = "Of course I'll plan a date, but don't get any ideas about other girls. You and I will have dinner at a fancy restaurant."
        self.chosen_idea = [
            "Plan a romantic dinner date between the player and the girl with such characteristics: ",
            "Create a unique and memorable date idea for the player and the girl with such characteristics: ",
            "Come up with a surprise date for the player and girl with such characteristics: ",
            "Generate a fun and adventurous date idea for the player and girl with such characteristics: "
        ]

    def generate_random(self):
        print("Enter story function random")
        cha_prop = self.runner.m_chat_core.AICharacterDefinition
        random_index = random.randint(0, 3)
        self.story_prompt = self.chosen_idea[random_index] + cha_prop
        res_str = self.chosen_idea[random_index] + cha_prop
        return res_str

    def generate_continue(self):
        print("Enter story function continue")
        print(self.story_prompt)
        res_str = self.story_prompt
        return res_str