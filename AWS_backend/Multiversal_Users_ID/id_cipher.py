import json
import boto3
import os
import hashlib
import random
import string
import time

# import sys
# sys.path.append("./packages")
TOKEN_VALID_TIME = 86400

token_to_secret_bucket = "multiversal-lovers-token-to-public-bucket"
secret_to_public_bucket = "multiversal-lovers-secret-to-public-bucket"
public_to_secret_bucket = "multiversal-lovers-public-to-secret-bucket"


# secret user id: the secret id is for login. the secret id meant to be secret to both user and other people.
# public user id: this is for storing things and genereate urls. because the url will be visible in js if sent things back. so this is for public access and visible for all

# public methods ==================================================================================================
def create_new_id():
    s3 = boto3.client('s3')
    # first, create a new secret hash id, check for duplicate, if no duplicated id, then it's all good
    # then create a public user id. this user id is for
    secret_user_id = get_unique_key_in_bucket(secret_to_public_bucket)
    public_user_id = get_unique_key_in_bucket(public_to_secret_bucket)

    # store both keys
    s3.put_object(Bucket = secret_to_public_bucket, Key = secret_user_id, Body = public_user_id.encode('utf-8'))
    s3.put_object(Bucket = public_to_secret_bucket, Key = public_user_id, Body = secret_user_id.encode('utf-8'))

    return {"secret_user_id": secret_user_id, "public_user_id": public_user_id}

def encrypte_secret_id(secret_user_id):
    s3 = boto3.client('s3')
    encrypted_token = get_unique_key_in_bucket(token_to_secret_bucket)
    id_json = {
        "secret_user_id": secret_user_id,
        "encrypted_time": time.time()
    }
    s3.put_object(Bucket = token_to_secret_bucket, Key = encrypted_token, Body = json.dumps(id_json).encode('utf-8'))

def decrypte_secret_id(encrypted_id):
    id_json = try_get_key(token_to_secret_bucket, encrypted_id)
    if (id_json == None):
        return {
            "status": "failed",
            "message": "the token is not found"
        }

    if (time.time() - id_json["encrypted_time"] < TOKEN_VALID_TIME):
        return {
            "status": "success",
            "secret_user_id": id_json["secret_user_id"]
        }
    else:
        return {
            "status": "failed",
            "message": "login in is timeout"
        }

def get_public_id(secret_user_id):
    public_user_id = try_get_key(secret_to_public_bucket, secret_user_id)
    return public_user_id



# private methods ==================================================================================================
def get_unique_key_in_bucket(bucket):
    key = random_hash()
    while (try_get_key(bucket, key) != None):
        key = random_hash()
    return key

def random_hash():
    random_bytes = os.urandom(16) # generate 16 random bytes
    hash_object = hashlib.sha256(random_bytes)
    return hash_object.hexdigest()

def try_get_key(bucket, key):
    s3 = boto3.client('s3')
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        response = json.loads(response['Body'].read().decode('utf-8').strip('\"'))
        return response
    except s3.exceptions.NoSuchKey:
        return None


def random_string(length):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for i in range(length))