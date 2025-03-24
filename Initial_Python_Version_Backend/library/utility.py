import copy
import random
import math

class MessageClamping:
    # token_count_method should accept a string and return a list
    def __init__(self, token_count_method):
        self.count_tokens = token_count_method
    
    def clamp_messages(self, messages, max_token_allowed, preregistered_lines, bottom_reregistered_lines):
        message_being_sent = []
        total_tokens = 0

        if preregistered_lines + bottom_reregistered_lines >= len(messages):
            return messages

        # Add preregistered_lines messages from the front
        for i in range(preregistered_lines):
            message_being_sent.append(messages[i])
            total_tokens += self.count_tokens(messages[i]["content"])

        # Add bottom_reregistered_lines messages from the bottom
        index_from_bottom = len(messages) - 1
        for i in range(bottom_reregistered_lines):
            message_being_sent.append(messages[index_from_bottom])
            total_tokens += self.count_tokens(messages[index_from_bottom]["content"])
            index_from_bottom -= 1

        # Add as many messages as possible from the bottom without exceeding max_token_allowed
        for message in reversed(messages[preregistered_lines:index_from_bottom + 1]):
            message_tokens = self.count_tokens(message["content"])

            if total_tokens + message_tokens > max_token_allowed:
                break

            if message not in message_being_sent:
                message_being_sent.insert(preregistered_lines, message)
                total_tokens += message_tokens

        return message_being_sent
    


class TextModification:
    def __init__(self):
        self.standard_length_range = [12, 100]
        self.punctuation_probabilities = {
            ",": 0.2,
            ".": 0.45,
            "!": 0.85,
            "?": 0.85,
        }

    def _increase_separation_probability(self, char_count, base_probability):
        complement_prob_addon = (1.0 - base_probability) / 6.0
        return (math.atan(char_count/7.0) * complement_prob_addon) + base_probability

    def _is_last_punctuation(self, text, index):
        remaining_text = text[index + 1:]
        for char in remaining_text:
            if char in self.punctuation_probabilities:
                return False
        return True

    def separate_text_message(self, text):
        separated_messages = []
        current_message = ""
        char_count = 0

        for i, char in enumerate(text):
            current_message += char
            char_count += 1

            if char in self.punctuation_probabilities:
                if self._is_last_punctuation(text, i):
                    break
                base_probability = self.punctuation_probabilities[char]
                probability = self._increase_separation_probability(char_count, base_probability)
                if random.random() < probability:
                    separated_messages.append(current_message.strip())
                    current_message = ""
                    char_count = 0
        if current_message.strip():
            separated_messages.append(current_message.strip())

        return separated_messages
