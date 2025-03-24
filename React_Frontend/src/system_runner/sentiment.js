export class SentimentAndMoods {
    constructor(character_runner = null) {
        this.runner = character_runner;
        this.current_emotion = 0.0; // a value in between -100.0 to 100.0, positive means happy, negative means not happy
        this.current_tier = 0;
        this.tier_change_animation = "";
        this.current_idle_name = "normalBase";
    }

    process_a_input(word) {
        console.log(word)
        let delta = SentimentDictionary.check_a_word(word);
        this.current_emotion += delta * 2.5;
        this.current_emotion = Math.min(Math.max(this.current_emotion, -100.0), 100.0);
        const new_tier = this.get_mood_tier()
        this.calculate_tier_change(new_tier);
        return delta;
    }
    
    get_current_mood_word() {
        let tiers = [
            { limit: -75, word: "very mad" },
            { limit: -50, word: "mad" },
            { limit: -25, word: "slightly unhappy" },
            { limit: 25, word: "normal" },
            { limit: 50, word: "happy" },
            { limit: 75, word: "very happy" },
            { limit: 100, word: "very very happy" },
        ];
    
        for (let tier of tiers) {
            if (this.current_emotion <= tier.limit) {
                return tier.word;
            }
        }
    }
    
    get_current_mood_description() {
        let mood_word = this.get_current_mood_word();
        if (mood_word === "normal") {
            return "";
        } else {
            return `Your current mood is ${mood_word}.`;
        }
    }
    
    get_mood_tier() {
        if (this.current_emotion < -35) {
            return -1;
        } else if (this.current_emotion <= 35) {
            return 0;
        } else {
            return 1;
        }
    }

    get_tier_change_animation() {
        if (this.tier_change_animation == "") {
            return null;
        }
        const out = {
            "new_idle_name": this.current_idle_name,
            "idle_transaction_clip_name": this.tier_change_animation
        }
        this.tier_change_animation = "";
        return out;
    }

    get_animation_clip_with_delta(delta) {
        let isUp = false;
        let isDown = false;
        if (delta > 1.1) {
            isUp = true;
        } else if (delta < -1.1) {
            isDown = true;
        }

        const tier = this.get_mood_tier()
        if (tier == -1) {
            if (isUp) {
                return "madDeltaUp";
            } else if (isDown) {
                return "madDeltaDown";
            }
        } else if (tier == 0) {
            if (isUp) {
                return "normalDeltaUp";
            } else if (isDown) {
                return "normalDeltaDown";
            }
        } else if (tier == 1) {
            if (isUp) {
                return "happyDeltaUp";
            } else if (isDown) {
                return "happyDeltaDown";
            }
        }
        return "";
    }

    calculate_tier_change(new_tier) {
        if (this.current_tier === new_tier) {
            this.tier_change_animation = ""
            return
        }

        if (this.current_tier === -1) {
            this.tier_change_animation = "madTo"
        } else if (this.current_tier === 0) {
            this.tier_change_animation = "normalTo"
        } else if (this.current_tier === 1) {
            this.tier_change_animation = "happyTo"
        }

        if (new_tier === -1) {
            this.tier_change_animation += "Mad"
            this.current_idle_name = "madBase"
        } else if (new_tier === 0) {
            this.tier_change_animation += "Normal"
            this.current_idle_name = "normalBase"
        } else if (new_tier === 1) {
            this.tier_change_animation += "Happy"
            this.current_idle_name = "happyBase"
        }
        this.current_tier = new_tier
    }
}

export class SentimentDictionary {
    // a dictionary for word to delta sentiment.
    // stores "word": "value" pairs. if a word is positive when describing sentiment, it has a positive value between 0.0 to 3.0, depends on how positive. the same for negative words. 0.0 to -3.0

    static check_a_word(word) {
        if (word in this.words_to_sentiment) {
            return this.words_to_sentiment[word];
        } else {
            return 0;
        }
    }

    static words_to_sentiment = {
        "appreciative": 2.0,
        "adoring": 2.0,
        "affectionate": 1.5,
        "touched": 2.5,
        "blushing": 1.5,
        "flattered": 1.5,
        "cheerful": 1.5,
        "compassionate": 2.5,
        "confident": 1.5,
        "content": 1.0,
        "delighted": 2.0,
        "ecstatic": 3.0,
        "energetic": 1.5,
        "grateful": 2.0,
        "hopeful": 1.5,
        "inspired": 2.0,
        "joyful": 2.5,
        "loving": 2.0,
        "optimistic": 1.5,
        "proud": 1.5,
        "relaxed": 1.0,
        "satisfied": 1.5,
        "supportive": 2.0,
        "thankful": 2.0,
        "uplifted": 2.5,
        "angry": -1.5,
        "anxious": -1.5,
        "bitter": -2.0,
        "dejected": -2.5,
        "depressed": -3.0,
        "disappointed": -2.0,
        "discouraged": -1.5,
        "disgusted": -2.5,
        "envious": -1.5,
        "frustrated": -2.0,
        "gloomy": -1.5,
        "guilty": -1.5,
        "hateful": -2.5,
        "hurt": -2.0,
        "insecure": -1.5,
        "jealous": -2.0,
        "lonely": -2.5,
        "resentful": -2.0,
        "sad": -1.5,
        "stressed": -1.5,
        "thrilled": 2.5,
        "happy": 1.5,
        "unhappy": -1.5,
        "excited": 1.5,
        "jealous": -2.0,
        "relieved": 1.0,
        "worried": -1.5,
        "insecure": -1.5,
        "disapproving": -1.5,
        "disheartened": -2.0,
        "grateful": 2.0,
        "curious": 0.0,
        "glad": 1.5,
        "confused": 0.0
    };
}