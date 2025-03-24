import json

class DataLoader:
    def __init__(self):
        self.relation_tier_file = 'documents/relationTiers.json'
        self.character_data_file_ai = 'documents/characterAI.json'
        self.character_data_file_user = 'documents/characterUser.json'
        self.relation_progress_file = 'documents/relation_progross.json'
        self.chat_history_file = 'documents/chat_history.json'

    def load_tiers(self):
        with open(self.relation_tier_file, 'r') as file:
            return json.load(file)

    def load_ai(self):
        with open(self.character_data_file_ai, 'r') as file:
            return json.load(file)

    def load_user(self):
        with open(self.character_data_file_user, 'r') as file:
            return json.load(file)

    def load_relation_progress(self):
        with open(self.relation_progress_file, 'r') as file:
            return json.load(file)

    def write_back_ai(self, data):
        with open(self.character_data_file_ai, 'w') as outfile:
            json.dump(data, outfile)

    def write_back_user(self, data):
        with open(self.character_data_file_user, 'w') as outfile:
            json.dump(data, outfile)

    def write_relation_progress(self, new_relation_data):
        with open(self.relation_progress_file, 'w') as outfile:
            json.dump(new_relation_data, outfile)

    def write_chat_history(self, messages):
        message_json = {"time": "None", "content": messages}
        with open(self.chat_history_file, 'w') as outfile:
            json.dump(message_json, outfile)
