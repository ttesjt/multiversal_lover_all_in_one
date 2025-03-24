"""
can be used:
from a sentence gpt' emotional evaluation, determine the actual change on some key values
from a sentence gpt' command evaluation ~same~
do some checks on gpt response and see if some key identiy have lost.
"""


# keys for emotions: when one is negative, likely to have chain effects on others.
# when overally positive emotion is high up, don't mention low emotions. However, if the overall is positive, then mention all the positive keywords. same to negative
# when a emotion list is not mentioned, then it should graduatly move to 0. the move amount should be equal to the amount of token checked in the current conversation.
happy_keywords = ["joyful", "enjoyed", "cnntent","delighted","ecstatic","elated","glad","pleasant","merry","pleased","thrilled","cheerful",
"euphoric","grateful","overjoyed","radiant","satisfied","blissful","exultant","lighthearted","upbeat"]
sad_keywords = ["sad", "unhappy", "sorrowful", "gloomy", "downcast", "low", "depressed", "dejected", "displeased", "unsatisfied", "dissatisfied"]

enjoyed_keywords = ["enjoy","enjoyed", "approval", "interest", "interested", "like", "likes", "satisfied"]

disgusted_keywords = ["disgusted", "sick", "displeased", "hate", "offensive", "offended", "annoyed", "annoying"]

angry_keywords = ["angry", "mad", "offended", "offensive"]

jealous_keywords = ["jealous", "possessive", "needy", "clingy", "anxious", "protective"]


class KeywordSearch:
    def __init__(self, positive_keywords, negative_keywords, negate_keywords, scale_up_keywords, scale_down_keywords):
        self.positive_keywords = positive_keywords
        self.negative_keywords = negative_keywords
        self.negate_keywords = negate_keywords
        self.scale_down_keywords = scale_down_keywords
        self.scale_up_keywords = scale_up_keywords
        self.negate = False
        self.negate_i = 0
        self.scale = 1.0
        self.scale_i = 0
        self.negate_cancel_threshold = 2
        self.scale_cancel_threshold = 2
        
    def process_string(self, string):
        return ''.join(c.lower() if c in [',', ' '] else c for c in string)
    
    # check if there are negates keyword to make the effect inverse
    def check_negate(self, word):
        if word in self.negate_keywords:
            self.negate = True
            self.negate_i = 0
        elif self.negate:
            if self.negate_i == self.negate_cancel_threshold:
                self.negate = False
                self.negate_i = 0
            else:
                self.negate_i += 1
    # check if there are adject or adverb that scale up the effect
    def check_scale(self, word):
        if word in self.scale_down_keywords:
            self.scale = 0.5
            self.scale_i = 0
            self.negate = False
            self.negate_i = 0
        elif word in self.scale_up_keywords:
            self.scale = 2.0
            self.scale_i = 0
            self.negate = False
            self.negate_i = 0
        elif self.scale != 1.0:
            if self.scale_i == self.scale_cancel_threshold:
                self.scale = 1.0
                self.scale_i = 0
            else:
                self.scale_i += 1
    
    def parse_reset(self):
        self.negate = False
        self.negate_i = 0
        self.scale = 1.0
        self.scale_i = 0

    def search(self, string):
        processed_string = self.process_string(string)
        score = 0
        self.parse_reset()
        words = processed_string.split()
        for word in words:
            self.check_negate(word)
            self.check_scale(word)
            if word in self.positive_keywords:
                score += self.scale if not self.negate else -self.scale
                self.parse_reset()
            elif word in self.negative_keywords:
                score -= self.scale if not self.negate else -self.scale
                self.parse_reset()
        
        return score