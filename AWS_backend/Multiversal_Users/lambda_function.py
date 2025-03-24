import json

import storage

def lambda_handler(event, context):
    action = event.get('action')

    headers = {
        "Access-Control-Allow-Header" : "*",
        "Access-Control-Allow-Origin" : "*",
        "Access-Control-Allow-Methods" : "*",
        "Accept" : "*/*",
        "Content-Type" : "application/json"
    }

    if not action:
        return form_response_json(400, headers, "failed", "Invalid request. Please provide action.")

    if action == 'sign_in' or action == 'sign_up':
        username = event.get('username')
        password = event.get('password')
        if not username or not password:
            return form_response_json(400, headers, "failed", "Invalid request. Please provide username, password for sign in or sign up.")
        user_data = {
            "username": username,
            "password": password
        }
        
        if action == 'sign_in':
            response = storage.try_sign_in(user_data)
            if response == "not_found":
                return form_response_json(404, headers, "failed", "User not found.")
            elif response == "wrong_password":
                return form_response_json(401, headers, "failed", "Incorrect password.")
        elif action == 'sign_up':
            response = storage.try_sign_up(user_data)
            if response == "already_exists":
                return form_response_json(409, headers, "failed", "Username already exists.", "email address is taken.")
    else:
        user_token = event.get('user_id')
        user_id = user_token # might have to decrypte later
        if not user_id or not action:
            return form_response_json(400, headers, "failed", "Invalid request. Please provide user_id(token) for this action")

        if action == "get_character":
            character_id = event.get('character_id')
            if not character_id:
                return form_response_json(400, headers, "failed", "Character id is required")
            response = storage.try_get_one_characters_of_a_user(user_id, character_id)
            if response == None:
                return form_response_json(404, headers, "failed", "Character not found.")
        elif action == "upload_character":
            character_data = event.get('character_data')
            if not character_data:
                return form_response_json(400, headers, "failed", "Character data is required")
            response = storage.upload_a_character(user_id, character_data)
            if response == None:
                return form_response_json(404, headers, "failed", "character name cannot be the same with others")
        elif action == "get_user":
            response = storage.get_user_all(user_id)
            if response == None:
                return form_response_json(404, headers, "failed", "token not found.")
        elif action == "update_user":
            pass
        elif action == "update_character":
            update_character_data = event.get('update_character_data')
            if not update_character_data:
                return form_response_json(400, headers, "failed", "New character data is required")
            response = storage.update_a_character(user_id, update_character_data)
            if response == None:
                return form_response_json(404, headers, "failed", "token not found.")
        elif action == "delete_character":
            character_id = event.get('character_id')
            if not character_id:
                return form_response_json(400, headers, "failed", "Character id is required")
            response = storage.delete_a_character(user_id, character_id)
            if response == None:
                return form_response_json(404, headers, "failed", "not found")

        else:
            return form_response_json(400, headers, "failed", "Invalid action.")

    return form_response_json(200, headers, "successed", response)


def form_response_json(code, headers, status, body, message = ""):
    return {
        'statusCode': code,
        'header': headers,
        "status": status,
        "message": message,
        'body': body
    }

