import json
import boto3
# import sys
# sys.path.append("./packages")

s3_bucket_name = "multiversal-lovers-image-bucket"

def try_get_key(key):
    s3 = boto3.client('s3')
    try:
        response = s3.get_object(Bucket=s3_bucket_name, Key=key)
        the_list = json.loads(response['Body'].read().decode('utf-8').strip('\"'))
        print(type(the_list))
        return the_list
    except s3.exceptions.NoSuchKey:
        return None

def try_get_character_animation(user_id, character_id):
    combined_id = user_id + "_" + character_id
    return try_get_key(combined_id)


def upload_character_animation(user_id, character_id, all_images):
    combined_id = user_id + "_" + character_id

    clip_name_list = [
        "mad_delta_up",
        "mad_delta_down",
        "normal_delta_up",
        "normal_delta_down",
        "happy_delta_up",
        "happy_delta_down"
    ]
    # the same order as the name list
    clip_list = [[], [], [], [], [], []]

    base_name_list = [
        "mad_base",
        "normal_base",
        "happy_base",
        "happy_to_normal",
        "normal_to_happy",
        "normal_to_mad",
        "mad_to_normal"
    ]
    base_list = [[], [], [], [], [], [], []]


    for img in all_images:
        filename = img["filename"]
        # filename is in a pattern of prefix_clipNum_frameNum
        # for example: mad_delta_up_001_001
        # igore any that is not in this pattern
        index = 0
        added_to_delta_list = False
        for prefix in clip_name_list:
            if prefix in filename:
                # try find the last two numbers (clipNum and frameNum) as int
                # if either one is not valid, then skip
                try:
                    clip_num, frame_num = map(int, filename.split(prefix + '_')[1].split('_'))
                    # add the image into the list of clip_list[index][clip_num][frame_num]
                    # if the clip_list[index] is not large enough, create empty lists to hold the place
                    while len(clip_list[index]) <= clip_num:
                        clip_list[index].append([])
                    # if the frame array is not large enough, create None to hold the previous frame, and later fill it up
                    while len(clip_list[index][clip_num]) <= frame_num:
                        clip_list[index][clip_num].append(None)
                    # Assign the image to the correct position in the clip_list
                    clip_list[index][clip_num][frame_num] = img
                    added_to_delta_list = True
                except (ValueError, IndexError):
                    continue
            index += 1
        if not added_to_delta_list:
            frame_num = 0
            try:
                frame_num = int(filename.split('_')[-1])
            except ValueError:
                continue
            index = 0
            for prefix in base_name_list:
                if prefix in filename:
                    add_to_any_index(img, base_list[index], frame_num)
            index += 1

    # Remove None values in clip_list
    for clip in clip_list:
        for i, frame_list in enumerate(clip):
            clip[i] = [frame for frame in frame_list if frame is not None]

    # Remove None values in base_list
    for i, frame_list in enumerate(base_list):
        base_list[i] = [frame for frame in frame_list if frame is not None]

    expression_list = {
        "mad_delta_up": clip_list[0],
        "mad_delta_down": clip_list[1],
        "normal_delta_up": clip_list[2],
        "normal_delta_down": clip_list[3],
        "happy_delta_up": clip_list[4],
        "happy_delta_down": clip_list[5],
        "mad_base": base_list[0],
        "normal_base": base_list[1],
        "happy_base": base_list[2],
        "happy_to_normal": base_list[3],
        "normal_to_happy": base_list[4],
        "normal_to_mad": base_list[5],
        "mad_to_normal": base_list[6]
    }

    s3 = boto3.client('s3')
    s3.put_object(Bucket=s3_bucket_name, Key=combined_id, Body=json.dumps(expression_list).encode('utf-8'))

# this is not necessary in js maybe becuase in js you can just add in to a index without worry
def add_to_any_index(img, target_list, frame_num):
    while len(target_list) <= frame_num:
        target_list.append(None)
    target_list[frame_num] = img

# this is for gifs or videos
"""
def upload_character_gifs(user_id, character_id, all_gifs):
    combined_id = user_id + "_" + character_id

    mad_delta_up = []
    mad_delta_down = []
    normal_delta_up = []
    normal_delta_down = []
    happy_delta_up = []
    happy_delta_down = []

    expression_list = {
        "mad_delta_up": mad_delta_up,
        "mad_delta_down": mad_delta_down,
        "normal_delta_up": normal_delta_up,
        "normal_delta_down": normal_delta_down,
        "happy_delta_up": happy_delta_up,
        "happy_delta_down": happy_delta_down,
        "mad_base": "",
        "normal_base": "",
        "happy_base": "",
        "happy_to_normal": "",
        "normal_to_happy": "",
        "normal_to_mad": "",
        "mad_to_normal": ""
    }

    for gif in all_gifs:
        filename = gif["filename"]
        if "mad_delta_up" in filename:
            mad_delta_up.append(gif)
        elif "mad_delta_down" in filename:
            mad_delta_down.append(gif)
        elif "normal_delta_up" in filename:
            normal_delta_up.append(gif)
        elif "normal_delta_down" in filename:
            normal_delta_down.append(gif)
        elif "happy_delta_up" in filename:
            happy_delta_up.append(gif)
        elif "happy_delta_down" in filename:
            happy_delta_down.append(gif)
        elif filename == "mad_base":
            expression_list["mad_base"] = gif
        elif filename == "normal_base":
            expression_list["normal_base"] = gif
        elif filename == "happy_base":
            expression_list["happy_base"] = gif
        elif filename == "happy_to_normal":
            expression_list["happy_to_normal"] = gif
        elif filename == "normal_to_happy":
            expression_list["normal_to_happy"] = gif
        elif filename == "normal_to_mad":
            expression_list["normal_to_mad"] = gif
        elif filename == "mad_to_normal":
            expression_list["mad_to_normal"] = gif

    s3 = boto3.client('s3')
    s3.put_object(Bucket=s3_bucket_name, Key=combined_id, Body=json.dumps(expression_list).encode('utf-8'))
"""


