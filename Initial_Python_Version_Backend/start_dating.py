from pydub import AudioSegment
from pydub.playback import play
import io

import time
import threading
from library import main_runner

# from library import ai_image_generation as aiimage

runner = main_runner.MainRunner()

def update_loop():
    update_interval = 0.075
    while True:
        out = runner.update()
        if (out["new_message"] != None and out["new_message"]["content"] != ""):
            print(out["new_message"]["content"], '\n')
        if (out["new_voice_message"] != None and out["new_voice_message"]["content"] != ""):
            print(out["new_voice_message"]["content"], '\n')
        if (out["new_audio_response"] != None):
            audio_file = io.BytesIO(out["new_audio_response"].content)
            audio_segment = AudioSegment.from_file(audio_file, format="mp3")
            play(audio_segment)
            print("audio in")
        # if (out["new_message"] != None): print(out["new_message"])
        time.sleep(update_interval)


update_thread = threading.Thread(target=update_loop)
update_thread.start()


def runningAlgorithm(text):
    textOutput = chat.chatWithGpt(text)
    imageOutput = aiimage.generate_image(text)
    return [textOutput, imageOutput]

while True:
    user_input = input()
    runner.user_input(user_input)

# ui = gr.Interface(fn=runningAlgorithm, inputs="text", outputs=["text", "image"]).launch()
# ui.launch()