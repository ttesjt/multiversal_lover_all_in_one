import json
import sys
import time
import boto3

s3_bucket_name = "multiversal-lovers-bucket"
user_id_bucket = "multiversal-lovers-users-bucket"
s3_chat_history_key_base = "chat_history"


# the two functions use boto3 as the power source
def read_message_from_quick_data_base(user_id, character_id):
    s3 = boto3.client('s3')
    if (check_existence_quick_data_base(get_chat_history_key(user_id, character_id))):
        response = s3.get_object(Bucket=s3_bucket_name, Key=get_chat_history_key(user_id, character_id))
        json_string = response['Body'].read().decode('utf-8').strip('\\"')
        messages = json.loads(json_string)
        return messages
    return []

def write_message_to_quick_data_base(user_id, character_id, messages):
    s3 = boto3.client('s3')
    print("dict key: ", get_chat_history_key(user_id, character_id))
    messages_bytes = bytes(json.dumps(messages), 'utf-8')
    s3.put_object(Bucket=s3_bucket_name, Key=get_chat_history_key(user_id, character_id), Body=messages_bytes)


def get_chat_history_key(user_id, character_id):
    return user_id + "_" + character_id + "_" + s3_chat_history_key_base


def check_existence_quick_data_base(key):
    # Create S3 client and check if object exists in S3
    s3 = boto3.client('s3')
    try:
        s3.head_object(Bucket=s3_bucket_name, Key=key)
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



def get_user_data(user_id):
    user_all = try_get_key(user_id_bucket, user_id)
    if (user_all == None):
        return None
    user_all["user_info"]["last_token_spend_time"] = time.time()
    return user_all

def save_user_data(user_id, user_data):
    s3 = boto3.client('s3')
    s3.put_object(Bucket=user_id_bucket, Key=user_id, Body=json.dumps(user_data).encode('utf-8'))


### really stupid way ###
# user stream
def get_user_base():
    s3 = boto3.client('s3')
    if (check_existence_quick_data_base("username")):
        response = s3.get_object(Bucket=s3_bucket_name, Key="username")
        all_users = response['Body'].read().decode('utf-8')
        return all_users
    else:
        username_bytes = bytes(json.dumps([]), 'utf-8')
        s3.put_object(Bucket=s3_bucket_name, Key="username", Body=username_bytes)
    return []

def try_get_from_list(value, list):
    try:
        index = list.index(value)
        return index
    except ValueError as e:
        return -1

#def try_sign_in(param):
#    all_users = get_user_base()
#    index = try_get_from_list(param["username"], all_users)





#def try_sign_up(param):
