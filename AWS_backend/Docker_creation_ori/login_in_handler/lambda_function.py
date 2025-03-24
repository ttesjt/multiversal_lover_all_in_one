import json

import storage

def lambda_handler(event, context):
    username = event.get('username')
    password = event.get('password')
    action = event.get('action')

    if not username or not password or not action:
        return {
            'statusCode': 400,
            "status": "failed",
            'body': json.dumps({"message": "Invalid request. Please provide username, password, and action."})
        }

    user_data = {
        "username": username,
        "password": password
    }

    if action == 'signin':
        response = storage.try_sign_in(user_data)
        if response == "not_found":
            return {
                'statusCode': 404,
                "status": "failed",
                'body': json.dumps({"message": "User not found."})
            }
        elif response == "wrong_password":
            return {
                'statusCode': 401,
                "status": "failed",
                'body': json.dumps({"message": "Incorrect password."})
            }
    elif action == 'signup':
        response = storage.try_sign_up(user_data)
        if response == "already_exists":
            return {
                'statusCode': 409,
                "status": "failed",
                'body': json.dumps({"message": "Username already exists."})
            }
    else:
        return {
            'statusCode': 400,
            "status": "failed",
            'body': json.dumps({"message": "Invalid action. Please provide a valid action: 'signin' or 'signup'."})
        }

    return {
        'statusCode': 200,
        "status": "successed",
        'body': json.dumps(response)
    }