import json
import boto3
# import sys
# sys.path.append("./packages")

character_avatar_bucket = "m-lovers-character-avatar-bucket"
s3_bucket_name = "multiversal-lovers-users-bucket"

import hashlib


def check_existence_quick_data_base(key):
    # Create S3 client and check if object exists in S3
    s3 = boto3.client('s3')
    try:
        s3.head_object(Bucket=s3_bucket_name, Key=key)
    except s3.exceptions.ClientError as e:
        return False
    # The object exists in S3
    return True

def try_get_key(key):
    s3 = boto3.client('s3')
    try:
        response = s3.get_object(Bucket=s3_bucket_name, Key=key)
        the_list = json.loads(response['Body'].read().decode('utf-8').strip('\"'))
        return the_list
    except s3.exceptions.NoSuchKey:
        return None

"""
def try_get_all_of_a_user_id(user_id):
    all_user_ids = get_or_create_list("all_user_ids")
    index = try_get_value_from_a_list_key(user_id, "user_id", all_user_ids)

    if index == -1:
        return None
    else:
        return all_user_ids[index]
"""

def try_get_all_of_a_user_id(user_id):
    return try_get_key(user_id)


def try_get_all_characters_of_a_user_id(user_id):
    out = try_get_all_of_a_user_id(user_id)
    
    for character in out["character_list"]:
        character["avatar_url"] = get_avatar_download_url(user_id, character["character_id"])

    if (out == None):
        return None
    else:
        return out["character_list"]


def try_get_all_info_of_a_user_id(user_id):
    out = try_get_all_of_a_user_id(user_id)
    if (out == None):
        return None
    else:
        return out["user_info"]


def get_avatar_download_url(user_id, character_id):
    s3 = boto3.client('s3')
    expiration = 86400
    avatar_key = user_id + "_" + character_id
    download_url = s3.generate_presigned_url('get_object', Params={'Bucket': character_avatar_bucket, 'Key': avatar_key}, ExpiresIn=expiration)
    return download_url

def create_presigned_post(bucket_name, object_key, fields=None, conditions=None, expiration=3600):
    s3 = boto3.client('s3')
    try:
        response = s3.generate_presigned_post(bucket_name, object_key, Fields=fields, Conditions=conditions, ExpiresIn=expiration)
    except ClientError as e:
        logging.error(e)
        return None
    return response

def get_avatar_upload_url(user_id, character_id):
    s3 = boto3.client('s3')
    expiration = 86400
    avatar_key = user_id + "_" + character_id
    # s3.put_object(Bucket=s3_bucket_name, Key = avatar_key, Body="placeholder".encode('utf-8'))
    # upload_url = s3.generate_presigned_url('put_object', Params={'Bucket': s3_bucket_name, 'Key': avatar_key}, ExpiresIn=expiration)
    upload_url = create_presigned_post(character_avatar_bucket, avatar_key)
    return upload_url

def upload_a_character(user_id, character_json):
    user_all = try_get_all_of_a_user_id(user_id)
    if (user_all == None):
        return None
    character_list = user_all["character_list"]
    # just no encryption for character name, might change it later
    character_name = character_json["name"]
    character_id = character_name
    character_nikename = None
    combined_id = user_id + "_" + character_id
    if ("nickname" in character_json):
        character_nikename = character_json["nickname"]

    upload_url = get_avatar_upload_url(user_id, character_id)

    new_character_base_info = {
        "character_id": character_id,
        "name": character_name, 
        "nickname": character_nikename,
        "avatar_url": "place_holder"
    }
    exist = check_existence_quick_data_base(combined_id)
    if (exist):
        # maybe override
        return None
    else:
        s3 = boto3.client('s3')
        s3.put_object(Bucket=s3_bucket_name, Key=combined_id, Body=json.dumps(character_json).encode('utf-8'))
        character_list.append(new_character_base_info)
        s3.put_object(Bucket=s3_bucket_name, Key=user_id, Body=json.dumps(user_all).encode('utf-8'))
        return {
            "character_id": character_id,
            "avatar_url": upload_url
        }


def try_get_a_characters_of_a_user_n_character_id(user_id, character_id):
    combined_id = user_id + "_" + character_id
    out = try_get_key(combined_id)
    if (out == None):
        return None
    else:
        return out

