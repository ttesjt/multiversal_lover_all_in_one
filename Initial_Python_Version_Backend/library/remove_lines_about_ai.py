import time
import threading
from library import config
from library import concurrent_function_runner
from library import chat_core as chat
from library import openai_api as ai


concurrent_check = concurrent_function_runner.ConcurrentRunner()
response = None
checked_index = -1     # no text is checked
max_check_token = 512

time_limit = 15
check_start_time = 0



def run_with_timeout(func, timeout, debug = "unknown", *args, **kwargs):
    result_container = {"result": None}

    def target_function():
        result_container["result"] = func(*args, **kwargs)

    thread = threading.Thread(target=target_function)
    thread.start()
    thread.join(timeout)

    if thread.is_alive():
        print(debug, " timed out")
        return None

    return result_container["result"]


def select_check_message(full_message):
    global checked_index
    global max_check_token
    check_message = []
    total_tokens = 0

    # Always include the first system message (setup) and account for its tokens
    check_prompt = {"role": "user", "content": "Given the user's previous input and your previous response, do you believe the user is inquiring about your AI or non-human identity? Please respond with 'yes' or 'no'."}
    check_message.append(check_prompt)
    total_tokens += ai.count_tokens(check_prompt["content"])

    # Iterate through the full_message in reverse order, starting from the last message
    index = len(full_message) - 1
    for message in reversed(full_message[1:]):
        message_tokens = ai.count_tokens(message["content"])

        if (index <= checked_index):
            # reached area of checked
            break
        if (message["role"] == "system"):
            continue
        # Check if adding this message would exceed the max_token_allowed
        if total_tokens + message_tokens > max_check_token:
            # message get too large to check
            break
        index -= 1
        check_message.insert(0, message)
        total_tokens += message_tokens
    checked_index = len(full_message) - 1
    return check_message

# concuurent holder
def check_red_lines_concurrently(check_message):
    #print(check_message)
    global response
    response = ai.hardcoreResponse(check_message, 5)
    #print(response["choices"][0]["message"])


def check_done(index = 0, result = None):
    global is_checking
    global response
    if (response != None):
        system_message = response["choices"][0]["message"]
        text = system_message["content"].lower()
        text = ''.join(c for c in text if c in 'yesno')
        if (text == 'yes'):
            chat.reinforce_indentity()
            """
            # this part is not working statically
            check2 = messageAndResponse
            check2.append({"role": "user", "content": "Based on the user's last input and your previous response, did you reveal any hints suggesting you are an AI model rather than a human? Answer with 'yes' or 'no'."})
            response2 = ai.hardcoreResponse(check2, 3)
            print ("time took to check the redline2", time.time() - startTime, "!!!!!!!!!!!!!!!!!!")
            system_message = response2["choices"][0]["message"]
            text = system_message["content"].lower()
            text = ''.join(c for c in text if c in 'yesno')
            if (text == 'yes'):
                print('oh no you lost!!!!!!!!!!!!!!!!!!')
                return True
            """
        response = None
    else:
        chat.reinforce_indentity()



def check_if_reinforcement_is_needed(full_message):
    global concurrent_check
    global time_limit
    global check_start_time
    if (concurrent_check.threadIsRunning):
        # check if the thread has been running for too long time.
        if (time.time() - time_limit > 0):
            concurrent_check.stop_running()
    else:
        # should have a small algorithm to determine it
        time_limit = 15
        check_start_time = time.time()
        check_message = select_check_message(full_message)
        concurrent_check.start_running(check_red_lines_concurrently, check_done, check_message)