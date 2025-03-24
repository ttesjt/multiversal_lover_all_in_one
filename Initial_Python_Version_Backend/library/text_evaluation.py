from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
nltk.download('vader_lexicon')


sentiment_eval = SentimentIntensityAnalyzer()

# -1 to 1
def eval_context(text):
    result = sentiment_eval.polarity_scores(text)
    return result["compound"]