import copy
import re
from library import config
from library import openai_api

commandList = ["voice", "image"]

# the message will not be modified during this process. So send the message which is designed to sent to the gpt
def checkCommand(sentToGptMessage):
    check = constructCheckMessage(sentToGptMessage)

    response = openai_api.requestSystemResponse(check, 128)
    system_message = response["choices"][0]["message"]
    text = system_message["content"].lower()
    text = re.sub(r"[^a-zA-Z\s]", "", text)         # remove other character, only keep space and letters
    return calculateCommands(text)

def constructCheckMessage(sentToGptMessage):
    checkMessage = []
    # find the latest user input. usually, it should be the first one at the bottom
    for item in reversed(sentToGptMessage):
        if item["role"] == "user":
            checkMessage.insert(0, item)
            break
    checkMessage.append({"role": "system", "content": "Check if the user's latest input contains any of the following commands: (1) asking you to show a picture of yourself in any way, or (2) asking you to send a voice of yourself in any way. If the input contains a command, respond with 'image' for command 1, 'voice' for command 2, or 'image voice' for both commands. If there are no commands, reply 'none'."})
    return checkMessage

def calculateCommands(text):
    global commandList
    result = []
    commandListTemp = text.split()
    for command in commandList:
        if command in commandListTemp:
            result.append(command)
    return result


def sendAVoiceMessage(text):
    return "nothing"

def takeAPhoto(prompt):
    return "nothing"
