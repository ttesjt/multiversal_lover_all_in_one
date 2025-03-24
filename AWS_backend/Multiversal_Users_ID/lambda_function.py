import json

import storage
import id_cipher

def lambda_handler(event, context):
    user_token = event.get('user_id')
    action = event.get("action")
    user_id = user_token # might have to decrypte later

    headers = {
        "Access-Control-Allow-Header" : "*",
        "Access-Control-Allow-Origin" : "*",
        "Access-Control-Allow-Methods" : "*",
        "Accept" : "*/*",
        "Content-Type" : "application/json"
    }
    response = {}

    if not user_id or not action:
        return {
            'statusCode': 400,
            'header': headers,
            "status": "failed",
            'body': {"message": "Invalid request. Please provide user_id(token) and action name"}
        }

    if action == "get_character":
        character_id = event.get('character_id')
        if not character_id:
            return {
                'statusCode': 400,
                'header': headers,
                "status": "failed",
                'body': {"message": "Invalid request. Please provide user_id(token) and action name"}
            }
        response = storage.try_get_a_characters_of_a_user_n_character_id(user_id, character_id)
        if response == None:
            return {
                'statusCode': 404,
                'header': headers,
                "status": "failed",
                'body': {"message": "token not found."}
            }
    elif action == "upload_character":
        character_data = event.get('character_data')
        if not character_data:
            return {
                'statusCode': 400,
                'header': headers,
                "status": "failed",
                'body': {"message": "Invalid request."}
            }
        response = storage.upload_a_character(user_id, character_data)
        if response == None:
            return {
                'statusCode': 404,
                'header': headers,
                "status": "failed",
                'body': {"message": "character name cannot be the same with others"}
            }
    else:
        if action == "get_user_all":
            response = storage.try_get_all_of_a_user_id(user_id)
            if response == None:
                return {
                    'statusCode': 404,
                    'header': headers,
                    "status": "failed",
                    'body': {"message": "token not found."}
                }
        elif action == "get_user_all_characters":
            response = storage.try_get_all_characters_of_a_user_id(user_id)
            print(type(response))
            if response == None:
                return {
                    'statusCode': 404,
                    'header': headers,
                    "status": "failed",
                    'body': {"message": "token not found."}
                }
        elif action == "get_user_all_info":
            response = storage.try_get_all_info_of_a_user_id(user_id)
            if response == None:
                return {
                    'statusCode': 404,
                    'header': headers,
                    "status": "failed",
                    'body': {"message": "token not found."}
                }
        else:
            return {
                'statusCode': 400,
                'header': headers,
                "status": "failed",
                'body': {"message": "Invalid action."}
            }

    return {
        'statusCode': 200,
        'header': headers,
        "status": "successed",
        'body': response
    }