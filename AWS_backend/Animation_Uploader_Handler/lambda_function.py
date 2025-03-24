import boto3
import json
from botocore.exceptions import ClientError

s3_bucket_name = 'm-lovers-animation'

def lambda_handler(event, context):
    s3 = boto3.client('s3')  # Moved this line to the top, so it's accessible by all functions

    user_id = event["user_id"]
    character_id = event["character_id"]
    combined_id = user_id + "_" + character_id

    if (event["request_type"] == "url_for_upload"):
        file_names = event.get('filenames', [])  # Use get() to avoid KeyError if 'filenames' is not provided
        pre_signed_urls = get_url_for_new_objects_upload(s3, file_names, combined_id)  # Pass s3 client to the function
    elif (event["request_type"] == "url_for_download"):
        pre_signed_urls = get_url_for_objects_download(s3, combined_id)  # Pass s3 client to the function
    else:
        return {
            'statusCode': 400,
            'body': "the request_type must exist and in range of 'url_for_upload' or 'url_for_download' "
        }

    response = {
        'statusCode': 200,
        'body': pre_signed_urls
    }
    return response

def create_presigned_post(bucket_name, object_key, fields=None, conditions=None, expiration=3600):
    s3 = boto3.client('s3')
    try:
        response = s3.generate_presigned_post(bucket_name, object_key, Fields=fields, Conditions=conditions, ExpiresIn=expiration)
    except ClientError as e:
        logging.error(e)
        return None
    return response

def get_url_for_new_objects_upload(s3, file_names, combined_id):
    expiration = 3600
    # name_to_key_dict holds the key to the individual image(clip) component
    name_to_key_dict = get_or_create_dict(s3, combined_id)  # Pass s3 client to the function
    pre_signed_urls = {}
    for file_name in file_names:
        key = combined_id + "_" + file_name
        s3.put_object(Bucket=s3_bucket_name, Key = key, Body="placeholder".encode('utf-8'))
        # url = s3.generate_presigned_url('put_object', Params={'Bucket': s3_bucket_name, 'Key': key}, ExpiresIn=expiration)
        url = create_presigned_post(s3_bucket_name, key)
        name_to_key_dict[file_name] = key
        pre_signed_urls[file_name] = url
    s3.put_object(Bucket=s3_bucket_name, Key=combined_id, Body=json.dumps(name_to_key_dict).encode('utf-8'))
    return pre_signed_urls

def get_url_for_objects_download(s3, combined_id):
    expiration = 3600
    name_to_key_dict = get_or_create_dict(s3, combined_id)  # Pass s3 client to the function
    pre_signed_urls = {}
    for file_name in name_to_key_dict:
        key = name_to_key_dict[file_name]
        url = s3.generate_presigned_url('get_object', Params={'Bucket': s3_bucket_name, 'Key': key}, ExpiresIn=expiration)
        pre_signed_urls[file_name] = url
    return pre_signed_urls

def get_or_create_dict(s3, key):
    # s3 is now passed as a parameter, so we don't need this line anymore
    try:
        response = s3.get_object(Bucket=s3_bucket_name, Key=key)
        the_dict = json.loads(response['Body'].read().decode('utf-8').strip('\"'))
        return the_dict
    except s3.exceptions.NoSuchKey:
        s3.put_object(Bucket=s3_bucket_name, Key=key, Body=json.dumps({}).encode('utf-8'))
        return {}

