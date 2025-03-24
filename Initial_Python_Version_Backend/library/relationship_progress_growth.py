import math

class RelationshipProgressGrowth:
    def __init__(self, max_growth_per_day=100.0):
        self.total_growth_today = 0.0
        self.current_growth_amount = 0.0
        self.max_growth_per_day = max_growth_per_day
        self.token_spent_today = 0.0
        self.token_account_base = 1000.0

    def update_growth(self, extra_token_spent):
        growth_increment = self.calculate_growth_increment(extra_token_spent)
        self.total_growth_today += growth_increment
        self.current_growth_amount += growth_increment
        self.token_spent_today += extra_token_spent
                

    def calculate_growth_increment(self, extra_token_spent):
        """Calculate growth increment based on a decreasing curve."""
        # growth_increment = self.max_growth_per_day / (1 + math.exp(20.0 * (self.token_spent / (self.token_spent_today + self.token_account_base))))
        growth_increment = 25.0 * (extra_token_spent / (self.token_spent_today + self.token_account_base))
        growth_increment = min(self.max_growth_per_day - self.total_growth_today, growth_increment)     # the delta to maximum or the actual increment
        return growth_increment

    def collect_increment(self):
        amount = self.current_growth_amount
        self.current_growth_amount = 0
        return amount
