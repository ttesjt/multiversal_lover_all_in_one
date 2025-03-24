import json
import sys
sys.path.append("./packages")

import boto3

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


def get_user_base():
    s3 = boto3.client('s3')
    if check_existence_quick_data_base("users"):
        response = s3.get_object(Bucket=s3_bucket_name, Key="users")
        all_users = json.loads(response['Body'].read().decode('utf-8'))
        return all_users
    else:
        s3.put_object(Bucket=s3_bucket_name, Key="users", Body=json.dumps([]).encode('utf-8'))
    return []


def try_get_user_from_all_users(name, all_users):
    for i, user in enumerate(all_users):
        if user["username"] == name:
            return i
    return -1

def try_sign_in(param):
    all_users = get_user_base()
    index = try_get_user_from_all_users(param["username"], all_users)
    if index == -1:
        return "not_found"

    if all_users[index]["password"] != param["password"]:
        return "wrong_password"

    user_data = all_users[index]
    return user_data


def try_sign_up(param):
    all_users = get_user_base()
    index = try_get_user_from_all_users(param["username"], all_users)
    if index != -1:
        return "already_exists"

    hash_object = hashlib.sha256(param["username"].encode())
    user_id = hash_object.hexdigest()
    new_user_data = {
        "username": param["username"],
        "password": param["password"],
        "user_id": user_id
    }

    all_users.append(new_user_data)
    s3 = boto3.client('s3')
    s3.put_object(Bucket=s3_bucket_name, Key="users", Body=json.dumps(all_users).encode('utf-8'))

    return new_user_data