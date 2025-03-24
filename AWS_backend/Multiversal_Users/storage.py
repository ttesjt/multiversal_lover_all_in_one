import time
import json
import boto3
# import sys
# sys.path.append("./packages")

chat_history_bucket = "multiversal-lovers-bucket"
character_bucket = "m-lovers-character-bucket"
username_password_bucket = "m-lovers-username-password-bucket"
user_id_bucket = "multiversal-lovers-users-bucket"
character_avatar_bucket = "m-lovers-character-avatar-bucket"

daily_free_token = 100000
max_number_of_character = 4

import hashlib


def check_existence_quick_data_base(bucket, key):
    # Create S3 client and check if object exists in S3
    s3 = boto3.client('s3')
    try:
        s3.head_object(Bucket=bucket, Key=key)
    except s3.exceptions.ClientError as e:
        return False
    # The object exists in S3
    return True

def try_get_key(bucket, key):
    s3 = boto3.client('s3')
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        the_list = json.loads(response['Body'].read().decode('utf-8').strip('\"'))
        print(type(the_list))
        return the_list
    except s3.exceptions.NoSuchKey:
        return None


def try_sign_in(param):
    user_sign_in_data = try_get_key(username_password_bucket, param["username"])
    if (user_sign_in_data == None):
        return "not_found"
    if user_sign_in_data["password"] != param["password"]:
        return "wrong_password"
    user_id = user_sign_in_data["user_id"]
    return get_user_all(user_id)


def try_sign_up(param):
    if (try_get_key(username_password_bucket, param["username"])):
        return "already_exists"
    #all_users = get_or_create_list("users")

    hash_object = hashlib.sha256(param["username"].encode())
    user_id = hash_object.hexdigest()

    if (check_existence_quick_data_base(user_id_bucket, user_id)):
        return "already_exists"

    s3 = boto3.client('s3')

    new_user_sign_in_data = {
        "password": param["password"],
        "user_id": user_id
    }
    s3.put_object(Bucket=username_password_bucket, Key=param["username"], Body=json.dumps(new_user_sign_in_data).encode('utf-8'))

    new_user_info = {
        "token_left": daily_free_token,
        "join_time": time.time(),
        "last_token_spend_time": time.time(), 
    }

    full_new_user_id_data = {
        "user_id": user_id,
        "username": param["username"],
        "nickname": param["username"],
        "display_name": param.get("display_name", ""),
        "character_list": [],
        "avatar_url": "https://firebasestorage.googleapis.com/v0/b/chat2-32e4a.appspot.com/o/ttesjt1681034798431?alt=media&token=5f3c1570-9020-4725-b876-ea5808fded0b",
        "user_info": new_user_info
    }
    s3.put_object(Bucket=user_id_bucket, Key=user_id, Body=json.dumps(full_new_user_id_data).encode('utf-8'))
    return get_user_all(user_id)


def upload_a_character(user_id, character_json):
    user_all = try_get_key(user_id_bucket, user_id)
    if (user_all == None):
        return None
    character_list = user_all["character_list"]
    if (len(character_list) >= max_number_of_character):
        return None

    # just no encryption for character name, might change it later
    character_name = character_json["name"]
    character_id = character_name
    character_nikename = None
    combined_id = user_id + "_" + character_id
    if ("nickname" in character_json):
        character_nikename = character_json["nickname"]

    upload_url = get_character_avatar_upload_url(user_id, character_id)

    new_character_info = {
        "character_id": character_id,
        "name": character_name, 
        "nickname": character_nikename,
        "avatar_url": "place_holder",
        "last_message_time": time.time(),
        "last_message": "",
        "creative_mode": character_json.get("creative_mode", False),
        "base_prompt": character_json.get("base_prompt", ""),
        "sample_messages": character_json.get("sample_messages", []),
        "exclude_progress_prompt": character_json.get("exclude_progress_prompt", True),
        "exclude_sentiment_prompt": character_json.get("exclude_sentiment_prompt", True),
        "appearance": character_json.get("exclude_sentiment_prompt", ""),
        "relation_progress": {
            "first_date": 0,
            "total_dating_seconds": 0,
            "number_of_messages": 0,
            "relation_prograss":0,
            "events_finished":0,
            "proper_ended_chat": True
        }
    }
    exist = check_existence_quick_data_base(character_bucket, combined_id)
    if (exist):
        # maybe override
        return None
    else:
        s3 = boto3.client('s3')
        s3.put_object(Bucket=character_bucket, Key=combined_id, Body=json.dumps(new_character_info).encode('utf-8'))
        character_list.append(new_character_info)
        s3.put_object(Bucket=user_id_bucket, Key=user_id, Body=json.dumps(user_all).encode('utf-8'))
        return {
            "character_id": character_id,
            "avatar_url": upload_url
        }


def update_a_character(user_id, update_character_data):
    user_all = try_get_key(user_id_bucket, user_id)
    if (user_all == None):
        return None
    character_list = user_all["character_list"]
    # just no encryption for character name, might change it later
    character_id = update_character_data["character_id"]
    combined_id = user_id + "_" + character_id

    upload_url = get_character_avatar_upload_url(user_id, character_id)

    new_character_info = None
    for character in character_list:
        if (character["character_id"] == character_id):
            new_character_info = character
    
    if (new_character_info != None):
        if "nickname" in update_character_data:
            new_character_info["nickname"] = update_character_data["nickname"]
        if "name" in update_character_data:
            new_character_info["name"] = update_character_data["name"]
        if "base_prompt" in update_character_data:
            new_character_info["base_prompt"] = update_character_data["base_prompt"]
        if "creative_mode" in update_character_data:
            new_character_info["creative_mode"] = update_character_data["creative_mode"]
        if "sample_messages" in update_character_data:
            new_character_info["sample_messages"] = update_character_data["sample_messages"]
        if "exclude_progress_prompt" in update_character_data:
            new_character_info["exclude_progress_prompt"] = update_character_data["exclude_progress_prompt"]
        if "exclude_sentiment_prompt" in update_character_data:
            new_character_info["exclude_sentiment_prompt"] = update_character_data["exclude_sentiment_prompt"]

        #if (update_character_data["update_avatar"]):
        # do something
    
    s3 = boto3.client('s3')
    s3.put_object(Bucket=character_bucket, Key=combined_id, Body=json.dumps(new_character_info).encode('utf-8'))
    s3.put_object(Bucket=user_id_bucket, Key=user_id, Body=json.dumps(user_all).encode('utf-8'))
    return {
        "character_id": character_id,
        "avatar_url": upload_url
    }


def delete_a_character(user_id, character_id):
    user_all = try_get_key(user_id_bucket, user_id)
    if (user_all == None):
        return None
    character_list = user_all["character_list"]
    combined_id = user_id + "_" + character_id

    for character in character_list:
        if (character["character_id"] == character_id):
            character_list.remove(character)
    
    s3 = boto3.client('s3')
    s3.delete_object(Bucket=character_bucket, Key=combined_id)                                      # delete character
    s3.delete_object(Bucket=chat_history_bucket, Key=combined_id)                                   # delete chat history
    s3.delete_object(Bucket=character_avatar_bucket, Key=combined_id)                               # delete avatar
    s3.put_object(Bucket=user_id_bucket, Key=user_id, Body=json.dumps(user_all).encode('utf-8'))    # update user
    return "success!"


def get_user_all(user_id):
    user_data = try_get_key(user_id_bucket, user_id)
    if (user_data == None):
        return "no user data"

    give_free_tokens_and_save(user_data)

    user_data["character_list"] = try_get_all_characters_of_a_user(user_id, user_data)
    # selectively choose what is in the return json
    user_data_return = {
        "user_id": user_data["user_id"],
        "username": user_data["username"],
        "nickname": user_data["nickname"],
        "avatar_url": user_data["avatar_url"],
        "user_info": user_data["user_info"],
        "character_list": user_data["character_list"]
    }
    return user_data_return

def give_free_tokens_and_save(full_user_data):
    current_time = time.time()
    last_active_time = full_user_data["user_info"]["last_token_spend_time"]
    full_user_data["user_info"]["last_token_spend_time"] = time.time()
    delta_time = current_time - last_active_time
    additional_tokens = (delta_time / 86400) * daily_free_token
    full_user_data["user_info"]["token_left"] = max(min(additional_tokens + full_user_data["user_info"]["token_left"], daily_free_token), 0)

    s3 = boto3.client('s3')
    s3.put_object(Bucket=user_id_bucket, Key=full_user_data["user_id"], Body=json.dumps(full_user_data).encode('utf-8'))


def try_get_all_characters_of_a_user(user_id, pre_loaded_user_data = None):
    user_data = pre_loaded_user_data
    if (user_data == None):
        user_data = try_get_key(user_id_bucket, user_id)
        if (user_data == None):
            return "Data Errors"

    for character in user_data["character_list"]:
        character["avatar_url"] = get_character_avatar_download_url(user_id, character["character_id"])
    return user_data["character_list"]


def try_get_one_characters_of_a_user(user_id, character_id):
    combined_id = user_id + "_" + character_id
    character = try_get_key(character_bucket, combined_id)
    if (character == None):
        return None
    else:
        character["avatar_url"] = get_character_avatar_download_url(user_id, character["character_id"])
        return character


def get_character_avatar_download_url(user_id, character_id):
    s3 = boto3.client('s3')
    expiration = 86400
    avatar_key = user_id + "_" + character_id
    download_url = s3.generate_presigned_url('get_object', Params={'Bucket': character_avatar_bucket, 'Key': avatar_key}, ExpiresIn=expiration)
    return download_url

def get_character_avatar_upload_url(user_id, character_id):
    s3 = boto3.client('s3')
    expiration = 86400
    avatar_key = user_id + "_" + character_id
    # s3.put_object(Bucket=s3_bucket_name, Key = avatar_key, Body="placeholder".encode('utf-8'))
    # upload_url = s3.generate_presigned_url('put_object', Params={'Bucket': s3_bucket_name, 'Key': avatar_key}, ExpiresIn=expiration)
    upload_url = create_presigned_post(character_avatar_bucket, avatar_key)
    return upload_url

def create_presigned_post(bucket_name, object_key, fields=None, conditions=None, expiration=3600):
    s3 = boto3.client('s3')
    try:
        response = s3.generate_presigned_post(bucket_name, object_key, Fields=fields, Conditions=conditions, ExpiresIn=expiration)
    except ClientError as e:
        logging.error(e)
        return None
    return response