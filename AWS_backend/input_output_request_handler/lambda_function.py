import openai_api
import text_to_voice_api
import utility
import time
import storage


chat_ai = openai_api.ChatApi()
voice_ai = text_to_voice_api.VoiceApi()
text_modifier = utility.TextModification()


def lambda_handler(event, context):
    response_body = {
        "statusCode": 500,
        "message": "Internal Error",
        'headers': {
            "Access-Control-Allow-Header" : "*",
            "Access-Control-Allow-Origin" : "*",
            "Access-Control-Allow-Methods" : "*",
            "Accept" : "*/*",
            "Content-Type" : "application/json"
        }
    }
    if (not validate_event(event, response_body)):
        return response_body

    user_id = event["user_id"]
    character_id = event["character_id"]
    used_own_api = False
    own_api = event.get("openai_api", "")
    if ("openai_api" in event and event["openai_api"] != ""):
        chat_ai.assign_api_key(event["openai_api"])
        used_own_api = True
    else:
        chat_ai.assign_api_key()

    #chat_history = []
    chat_history = storage.read_message_from_quick_data_base(user_id, character_id)
    user_data = storage.get_user_data(user_id)
    
    if (not user_data):
        response_body["message"]: "user not found error"
        response_body["body"]: "Error"
        return response_body

    if ('httpMethod' not in event or event['httpMethod'] == "GET"):
        response_body['statusCode'] = 200
        response_body['message'] = "success"
        response_body['n_unloaded_messages'] = 0
        response_body['body'] = chat_history
        return response_body
    elif (event['httpMethod'] == "PUT"):
        params = event.get("request_param", None)
        update_index = params.get("update_index", None)
        new_content = params.get("content", None)
        if (params == None or update_index == None or new_content == None or update_index >= len(chat_history)):
            response_body['statusCode'] = 400
            response_body['message'] = "failed"
            response_body['body'] = []
        else:
            chat_history[update_index]["content"] = new_content
            storage.write_message_to_quick_data_base(user_id, character_id, chat_history)
            response_body['statusCode'] = 200
            response_body['message'] = "success"
            response_body['body'] = chat_history
            return response_body
    elif (event['httpMethod'] == "DELETE"):
        params = event["request_param"]
        if (not params or "lines_to_delete" not in params or params.get("delete_all", False)):
            chat_history = []
            storage.write_message_to_quick_data_base(user_id, character_id, chat_history)
            response_body['statusCode'] = 200
            response_body['message'] = "success"
            response_body['body'] = []
            return response_body
        else:
            delete_list = []
            # first, gather message references by index
            for i in params["lines_to_delete"]:
                delete_list.append(chat_history[i])
            # then, remove the gathered references
            for message in delete_list:
                chat_history.remove(message)
            storage.write_message_to_quick_data_base(user_id, character_id, chat_history)
            response_body['statusCode'] = 200
            response_body['message'] = "success"
            response_body['body'] = chat_history
            return response_body
    else:

        character = None
        for item in user_data["character_list"]:
            if (item["character_id"] == character_id):
                character = item
        if (character):
            character["last_message_time"] = time.time()

        params = event["request_param"]
        # only one at a time to save time
        if (event["request_type"] == "text"):
            out = text_processing(params, user_data, used_own_api, chat_history, response_body)
        elif (params["request_type"] == "voice"):
            out = voice_ai.request_voice(params['message'])
            response_body['statusCode'] = 200
            response_body['message'] = "success"
            response_body['body'] = out

    storage.save_user_data(user_id, user_data)
    storage.write_message_to_quick_data_base(user_id, character_id, chat_history)

    return response_body


def text_processing(params, user_data, used_own_api, chat_history, response_body):
    out = {
        "message": None,
        "message_list": [],
        "token_left": user_data["user_info"]["token_left"]
    }
    print("the api key is ", chat_ai.get_current_api_key())
    
    token_spent = 0
    request_success = True
    if (not used_own_api and user_data["user_info"]["token_left"] < 100):
        request_success = False
    else:
        if (params['message_type'] == 'normal'):
            response = chat_ai.request_normal(params, chat_history)
            if (response == "faild"):
                request_success = False
            else:
                out["message"] = response["choices"][0]["message"]
                token_spent = response["choices"][0]["tokens_spent"]
        elif (params['message_type'] == 'hard'):
            response = chat_ai.request_hard(params, chat_history)
            if (response == "faild"):
                request_success = False
            else:
                out["message"] = response["choices"][0]["message"]
                token_spent = response["choices"][0]["tokens_spent"]

    if (request_success):
        if (params["store_request_in_chat"]):
            chat_history.append(params["message_list"][len(params["message_list"]) - 1])        # the message is always the last one in the list

        if (params["break_response"] and out["message"] != None):
            if (not utility.check_if_contains_sentiment(out["message"]["content"])):
                out["message"]["content"] = "[] " + out["message"]["content"]   # if no sentiment block, then append a empty one
            string_list = text_modifier.separate_text_message(out["message"]["content"])
            for piece in string_list:
                message_piece = {"role": "assistant", "content": piece}
                out["message_list"].append(message_piece)
                if (params["responde_as_chat"]):
                    chat_history.append(message_piece)
        else:
            if (params["responde_as_chat"] and params["message_type"] != "no_response"):
                if (not utility.check_if_contains_sentiment(out["message"]["content"])):
                    out["message"]["content"] = "[] " + out["message"]["content"]   # if no sentiment block, then append a empty one
                chat_history.append(out["message"])

        if (not used_own_api):
            out["token_left"] -= token_spent
            if (out["token_left"] < 0):
                out["token_left"] = 0
            user_data["user_info"]["token_left"] = out["token_left"]

        response_body['statusCode'] = 200
        response_body['message'] = "success"
        response_body['body'] = out
    else:
        new_out = {
            "message": {"role": "assistant", "content": "request to OpenAI has failed. Please Use/Check your API key."},
            "message_list": [{"role": "assistant", "content": "request to OpenAI has failed. Please Use/Check your API key."}],
            "token_left": user_data["user_info"]["token_left"]
        }
        if (params["store_request_in_chat"]):
            chat_history.append(params["message_list"][len(params["message_list"]) - 1])        # the message is always the last one in the list
        
        if (params["responde_as_chat"] and params["message_type"] != "no_response"):
            chat_history.append(new_out["message"])

        response_body['statusCode'] = 400
        response_body['message'] = "request to OpenAI has failed"
        response_body['body'] = new_out


    print("are you successed? ", request_success)
    return out

def validate_event(event, response_body):
    if not isinstance(event, dict):
        response_body["error"] = "Invalid input: event must be a dictionary and the event is " + str(type(event))
        return False

    if event['httpMethod'] == "GET" or event['httpMethod'] == "DELETE" or event["httpMethod"] == "PUT":
        return True
    elif event['httpMethod'] == "POST":
        if 'request_type' not in event or event['request_type'] not in ["text", "voice"]:
            response_body["error"] = "Invalid request_type: must be 'text' or 'voice'"
            return False

        params = event.get("request_param", {})

        if event['request_type'] == "text":
            required_fields = ['message_type', 'message_list', 'pre_lines', 'after_lines', "token_limit", "responde_as_chat", "store_request_in_chat", "break_response"]
            for field in required_fields:
                if field not in params:
                    response_body["error"] = f"Invalid parameters for 'text': missing {field}"
                    return False

            if params['message_type'] not in ["normal", "hard", "no_response"]:
                response_body["error"] = "Invalid message_type: must be 'normal', 'hard', 'no_response'"
                return False
        elif event['request_type'] == "voice":
            required_fields = ['httpMethod', 'message']
            for field in required_fields:
                if field not in params:
                    response_body["error"] = f"Invalid parameters for 'voice': missing {field}"
                    return False
    return True

