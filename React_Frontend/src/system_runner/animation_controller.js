export class AnimationController {
    constructor(character_runner = null) {
        this.is_ready = false;
        this.runner = character_runner;
        this.animationDisplaies = [];
        this.animationClips = null;
        this.currentIdleAnimation = null;
        this.currentClip = null;
        this.currentFrame = 0;
        this.transactionFlag = false;
        this.transactionClip = null;
        this.transactionFrame = 0; // Set the transaction frame index
        this.date = new Date();
        this.default_image = null;

        this.lastFrameTime = 0
        this.frameInterval = 40
    }

    upload_default_image(default_image) {
        this.default_image = default_image;
    }

    updata_animation_display_sole(display) {
        this.animationDisplaies = []
        this.animationDisplaies.push(display)
    }

    add_to_animation_display(display) {
        this.animationDisplaies.push(display);
    }

    clean_animation_display() {
        this.animationDisplaies = [];
    }

    async load_animations_and_play(user_id, character_id) {
        console.log("start")
        this.animation_io = new AnimationStream();
        const images_flat_list = await this.animation_io.download_all_images(user_id, character_id)
        this.animationClips = await format_json_from_flat_clip_list(images_flat_list)
        this.currentIdleAnimation = this.animationClips["normalBase"];
        this.currentClip = this.animationClips["normalBase"];
        console.log("done loading")
        if (this.currentClip && this.currentClip.length !== 0) {
            this.is_ready = true;
        }
        this.play()
    }

    validate_current_clip() {
        if (!this.is_ready || !this.currentClip || this.currentClip.length === 0) {
            return false
        }
        return true
    }

    play() {
        if (this.is_ready) {
            const animationLoop = () => {
                if (!this.validate_current_clip()) {
                    if (this.transactionFlag) {
                        this.executeTransaction();
                    }
                    this.displayFrame_React(null);
                } else {
                    // If transaction flag is true and current frame is the transaction frame, execute the transaction
                    if (this.transactionFlag && this.currentFrame === this.transactionFrame) {
                        this.executeTransaction();
                    }

                    if (Date.now() - this.lastFrameTime > this.frameInterval) {
                        // Display the current frame of the animation
                        this.displayFrame_React(this.currentClip[this.currentFrame]);
                        // Move to the next frame or loop back to the first frame
                        this.currentFrame = (this.currentFrame + 1) % this.currentClip.length;
                        // If the current animation is not the idle animation and has reached the end, transfer back to idle
                        if (this.currentClip !== this.currentIdleAnimation && this.currentFrame === 0) {
                            this.currentClip = this.currentIdleAnimation;
                        }
                        this.lastFrameTime = Date.now()
                    }
                }
                // Continue the animation loop
                requestAnimationFrame(animationLoop);
            };

            // Start the animation loop
            animationLoop();
        }
    }

    displayFrame_React(frame) {
        if (frame) {
            for (const animationDisplay of this.animationDisplaies) {
                animationDisplay.current.src = frame;
            }
        } else {
            for (const animationDisplay of this.animationDisplaies) {
                animationDisplay.current.src = this.default_image;
            }
        }
    }

    getFrame() {
        if (this.is_ready) {
            try {
                const frame = this.currentClip[this.currentFrame]
                if (frame) {
                    return frame;
                }
            } catch {
            }
        }
        return null;
    }

    change_idle(new_idle_name, idle_transaction_clip_name) {
        if (!(new_idle_name in this.animationClips) || !(idle_transaction_clip_name in this.animationClips)) {
            return;
        }
        console.log(new_idle_name, " transact ", idle_transaction_clip_name)
        this.currentIdleAnimation = this.animationClips[new_idle_name]
        this.currentFrame = 0
        // this.transactTo(idle_transaction_clip_name, () => {this.currentIdleAnimation = this.animationClips[new_idle_name]})
    }

    transactTo(clipname, start_call_back = null) {
        if (this.is_ready) {
            if (!(clipname in this.animationClips)) {
                return;
            }
            let newAnimationClip = null

            if (Array.isArray(this.animationClips[clipname])) {
                if (this.animationClips[clipname].length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.animationClips[clipname].length);
                    newAnimationClip = this.animationClips[clipname][randomIndex]
                }
            } else {
                newAnimationClip = this.animationClips[clipname]
            }

            if (newAnimationClip != null) {
                this.transaction_start_callback = start_call_back;
                this.transactionFlag = true;
                this.transactionClip = newAnimationClip;
            }
        }
    }

    executeTransaction() {
        console.log("transact")
        this.transactionFlag = false;
        this.currentClip = this.transactionClip;
        this.transactionClip = null;
        this.currentFrame = 0;
        if (this.transaction_start_callback !== null) {
            this.transaction_start_callback();
            this.transaction_start_callback = null;
        }
    }
}


class AnimationStream {
    constructor(url = "https://2o7uuggvg0.execute-api.us-west-1.amazonaws.com/Animation_URL_Live") {
        this.fetch_url = url;
    }

    async get_url_for_upload(user_id, character_id, filenames) {
        const request_json = {
            "user_id": user_id,
            "character_id": character_id,
            "request_type": "url_for_upload",
            "filenames": filenames
        }
        const response = this.request_url(request_json);
        return response
    }

    async get_url_for_download(user_id, character_id) {
        const request_json = {
            "user_id": user_id,
            "character_id": character_id,
            "request_type": "url_for_download",
        }
        const response = this.request_url(request_json);
        return response
    }

    // all_images: [ {"filename": "xyz", "image": image_obj}, xxx ]
    async upload_all_images(user_id, character_id, all_image_files) {
        const all_filenames = all_image_files.map(item => item.filename);
        // get all filenames
        const response = await this.get_url_for_upload(user_id, character_id, all_filenames);
        const url_object_dict = response["body"]
        // might consider use upload_objects list instead to keep name and image matching with all_url_dict
        await this.upload_images_to_urls(all_image_files, url_object_dict)
    }

    async download_all_images(user_id, character_id) {
        // get all filenames
        let all_url_dict = await this.get_url_for_download(user_id, character_id);
        // console.log(all_url_dict["body"])
        // contains all the images to each animation clips
        // return all_url_dict;
        // no need to actually download, just return the url
        return await this.download_images_from_urls_dict(all_url_dict["body"])
    }

    async upload_images_to_urls(imageList, urlDict) {
        const uploadPromises = imageList.map(async (imageData) => {
            const filename = imageData.filename;
            if (!urlDict.hasOwnProperty(filename)) {
                console.warn(`No matching URL found for filename: ${filename}. Skipping this image.`);
                return null;
            }

            const url_object = urlDict[filename];

            const formData = new FormData();
            // Add all the fields from the response to the FormData
            Object.keys(url_object.fields).forEach((key) => {
                formData.append(key, url_object.fields[key]);
            });
            formData.append('file', imageData.image);

            const response = await fetch(url_object.url, {
                method: 'POST',
                body: formData,
            });

            return response;
        }).filter(promise => promise !== null);

        const responses = await Promise.all(uploadPromises);
        return responses;
    }

    async post_file(presignedPostData, file) {
        const formData = new FormData();

        // Add all the fields from the response to the FormData
        Object.keys(presignedPostData.fields).forEach((key) => {
            formData.append(key, presignedPostData.fields[key]);
        });

        // Append the file to the FormData
        formData.append('file', file);

        // Send the POST request to the presigned URL
        const response = await fetch(presignedPostData.url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }
        return response;
    }

    async download_images_from_urls_dict(urlDict) {
        const downloadPromises = Object.entries(urlDict).map(([filename, url]) => {
            return fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to download image for filename: ${filename}`);
                    }
                    return response.blob();
                })
                .then(async (blob) => {
                    const fileContent = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsText(blob);
                    });

                    let imageArray = fileContent.split(/(?=data:)/);
                    for (let i = 0; i < imageArray.length; i++) {
                        if (imageArray[i].endsWith(",")) {
                            imageArray[i] = imageArray[i].slice(0, -1);
                        }
                    }
                    // animationDisplay.src = imageArray[0];
                    return { filename, image: imageArray };
                });
        });

        const imagesData = await Promise.all(downloadPromises);
        return imagesData;
    }


    async request_url(request_json) {
        return fetch(this.fetch_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request_json)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                return data; // Return the data so it gets passed to the termination callback
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}


class ImageListPacking {
    static encodeImageList(imageList) {
        return imageList;
    }

    static decodeImageList(encodedImageList) {
        return JSON.parse(encodedImageList);
    }
}

async function group_random_files_to_clips_format(all_images_files = [], all_names = []) {
    // each is a list of list 
    const delta_dict = { "madDeltaUp": {}, "madDeltaDown": {}, "normalDeltaUp": {}, "normalDeltaDown": {}, "happyDeltaUp": {}, "happyDeltaDown": {} }
    const base_dict = { "madBase": [], "normalBase": [], "happyBase": [], "happyToNormal": [], "normalToHappy": [], "normalToMad": [], "madToNormal": [] }

    // add every image from input to the structured json. this json will be parsed and then produced into a flat list
    // alter way is: extruct the last digit and use the previous name forming a key in
    for (const img of all_images_files) {
        const filename = img.filename;
        let added_to_delta_dict = false;
        for (const prefix in delta_dict) {
            // console.log(filename, " and the key is ", prefix)
            if (filename.includes(prefix)) {
                try {
                    const [clip_num, frame_num] = filename.split(`${prefix}_`)[1].split('_').map(Number);
                    const clip_list_name = prefix + "_" + clip_num.toString()
                    if (!all_names.includes(clip_list_name)) {
                        // if not in the list, then add the new name to the list and also create the new list for prefix
                        all_names.push(clip_list_name)
                        delta_dict[prefix][clip_list_name] = []
                    }

                    while (delta_dict[prefix][clip_list_name].length <= frame_num) {
                        delta_dict[prefix][clip_list_name].push(null);
                    }

                    delta_dict[prefix][clip_list_name][frame_num] = img.image;
                    added_to_delta_dict = true;
                } catch (error) {
                    console.error(error)
                    continue;
                }
            }
        }

        if (!added_to_delta_dict) {
            const parts = filename.split('_');
            let frame_num = 0;
            try {
                frame_num = parseInt(parts[parts.length - 1], 10);
            } catch (error) {
                continue;
            }

            for (const prefix in base_dict) {
                if (filename.includes(prefix)) {
                    const clip_list_name = prefix;
                    if (!all_names.includes(clip_list_name)) {
                        // if not in the list, then add the new name to the list and also create the new list for prefix
                        all_names.push(clip_list_name)
                    }
                    add_to_any_index(img.image, base_dict[prefix], frame_num);
                }
            }
        }
    }

    let flat_sprite_sheet_list = []
    for (const prefix in delta_dict) {
        for (const prefix_variant in delta_dict[prefix]) {
            delta_dict[prefix][prefix_variant] = delta_dict[prefix][prefix_variant].filter(frame => frame !== null);
            flat_sprite_sheet_list.push({ "filename": prefix_variant, "image": ImageListPacking.encodeImageList(delta_dict[prefix][prefix_variant]) })
        }
    }

    for (const prefix in base_dict) {
        base_dict[prefix] = base_dict[prefix].filter(frame => frame !== null);
        flat_sprite_sheet_list.push({ "filename": prefix, "image": ImageListPacking.encodeImageList(base_dict[prefix]) })
    }
    return flat_sprite_sheet_list
}

function add_to_any_index(img, target_list, frame_num) {
    while (target_list.length <= frame_num) {
        target_list.push(null);
    }
    target_list[frame_num] = img;
}


/*
input format:
{
  "filename": xyz,
  "image": the data
}
*/
async function format_json_from_flat_clip_list(flat_clip_list = []) {
    // each is a list of list 
    const delta_dict = { "madDeltaUp": [], "madDeltaDown": [], "normalDeltaUp": [], "normalDeltaDown": [], "happyDeltaUp": [], "happyDeltaDown": [] }
    const base_dict = { "madBase": "", "normalBase": "", "happyBase": "", "happyToNormal": "", "normalToHappy": "", "normalToMad": "", "madToNormal": "" }

    // for each image object in the given list
    for (const clip of flat_clip_list) {
        const filename = clip.filename;
        const parts = filename.split('_');
        let virant_number = 0;
        try {
            virant_number = parseInt(parts[parts.length - 1], 10);
        } catch (error) {
            // doesn't contain the number at the end, so it's a base
            continue;
        }

        let added = false;
        // loop through the delta list see if it's a variant of delta
        for (const prefix in delta_dict) {
            if (filename.includes(prefix)) {
                delta_dict[prefix].push(clip.image)
                added = true;
            }
        }

        if (!added) {
            for (const prefix in base_dict) {
                if (filename.includes(prefix)) {
                    base_dict[prefix] = clip.image
                }
            }
        }
    }

    const all_expressions = {
        "madDeltaUp": delta_dict["madDeltaUp"],
        "madDeltaDown": delta_dict["madDeltaDown"],
        "normalDeltaUp": delta_dict["normalDeltaUp"],
        "normalDeltaDown": delta_dict["normalDeltaDown"],
        "happyDeltaUp": delta_dict["happyDeltaUp"],
        "happyDeltaDown": delta_dict["happyDeltaDown"],
        "madBase": base_dict["madBase"],
        "normalBase": base_dict["normalBase"],
        "happyBase": base_dict["happyBase"],
        "happyToNormal": base_dict["happyToNormal"],
        "normalToHappy": base_dict["normalToHappy"],
        "normalToMad": base_dict["normalToMad"],
        "madToNormal": base_dict["madToNormal"]
    };
    return all_expressions
}