import { CharacterRunner } from './character_runner.js';
import { SystemLoader } from './load_system.js';
import { Config } from './config.js';


export class UserSystem {
    constructor() {
        this.loader = new SystemLoader();
        this.username = "";
        this.user_id = "";
    }

    // username & password
    form_sign_up_json(email, password, display_name, avatar) {
        return {
            "username": email,
            "password": password,
            "display_name": display_name,
            "avatar": avatar,
            "action": "sign_up"
        }
    }

    async sign_up(sign_up_json) {
        const result = await this.loader.post_to_database_url(sign_up_json);
        if (result["status"] == "successed") {
            this.username = sign_up_json["username"];
            this.user_id = result["body"]["user_id"];
        }
        return result;
    }

    // username & password
    async sign_in(username, password) {
        const sign_in_json = {
            "username": username,
            "password": password,
            "action": "sign_in"
        }
        const result = await this.loader.post_to_database_url(sign_in_json);
        if (result["status"] == "successed") {
            this.username = sign_in_json["username"];
            this.user_id = result["body"]["user_id"];
        }
        return result;
    }

    async sign_in_with_token(token) {
        const sign_in_json = {
            "user_id": token,
            "action": "get_user"
        }
        const result = await this.loader.post_to_database_url(sign_in_json);
        if (result["status"] == "successed") {
            this.username = sign_in_json["username"];
            this.user_id = result["body"]["user_id"];
        }
        return result;
    }
}


export class SystemRunner {
    constructor(user_data, app_functions, api_key = "") {
        this.api_key = api_key;
        Config.api_key = api_key;

        this.user_id = user_data["user_id"];
        this.display_name = user_data["display_name"];
        this.character_list = user_data["character_list"];
        this.user_data = user_data;
        this.token_left = user_data["user_info"]["token_left"];
        this.current_character_runner = null;
        this.loaded_character_list = []
        this.loader = new SystemLoader();
        this.number_of_messages = 0


        this.app_functions = app_functions
        this.app_finish_preparation_callback = app_functions["finish_preparation_callback"];
        this.app_set_loading = app_functions["set_loading"];
        this.app_new_message_update = app_functions["new_message_update"];

        this.loading_data = true;
        this.prepare_characters();
    }

    async prepare_characters() {
        this.app_set_loading(true)
        this.loading_data = true;
        for (const character of this.character_list) {
            character["avatar_url"] = await this.loader.load_data_from_url(character["avatar_url"]);
        }

        this.loading_data = false;
        if (this.app_finish_preparation_callback) {this.app_set_loading(false); this.app_finish_preparation_callback();}
    }

    assign_api_key(key) {
        this.api_key = key;
        Config.api_key = this.api_key;
        for (const character of this.loaded_character_list) {
            character.assign_api_key(this.api_key);
        }
    }

    get_user_data() {
        return this.user_data;
    }

    async request_user_data(force_reload = false) {
        if (this.user_data != null && !force_reload) {
            return this.user_data;
        }
        const request_json = {
            "action": "get_user",
            "user_id": this.user_id
        }
        const result = await this.loader.post_to_database_url(request_json);
        this.user_data = result;
        return result;
    }

    get_all_contacts() {
        if (this.user_data === null) {
            return []
        }
        return this.user_data["character_list"];
    }

    // return all the listed contact info from database as a list
    async request_all_contacts() {
        if (this.user_data != null) {
            return this.user_data["character_list"];
        }

        const result = await this.get_user_data();
        return result["character_list"]
    }

    /*
    output:
    {"character_id": "string"}
    */
    async create_a_new_character(new_character_json) {
        const request_json = {
            "action": "upload_character",
            "user_id": this.user_id,
            "character_data": new_character_json,
        }
        const result = await this.loader.post_to_database_url(request_json);
        return result
    }

    async update_a_character(update_character_data) {
        const request_json = {
            "action": "update_character",
            "user_id": this.user_id,
            "update_character_data": update_character_data,
        }
        const result = await this.loader.post_to_database_url(request_json);
        return result
    }

    // get a specific character information using the character ID
    // function returns as a json
    async get_a_character_info(character_id) {
        const request_json = {
            "action": "get_character",
            "user_id": this.user_id,
            "character_id": character_id
        }
        const result = await this.loader.post_to_database_url(request_json);
        return result
    }

    // return how much money a user still have in account
    async get_token_remaining() {
        return 1000;
    }

    get_remaining_token_from_response(response) {
        this.token_left = response["body"]["token_left"];
    }

    // create a new character instance and start conversation with her
    start_conversation(character_id) {
        prompt = null
        const character_list = this.get_all_contacts()
        let index = -1;
        if (character_list != null) {
            index = character_list.findIndex(character => character["character_id"] === character_id);
            if (index === -1) {
                return;
            }
        } else {
            return;
        }

        this.current_character_runner = null;
        for (const character of this.loaded_character_list) {
            if (character.character_id === character_id) {
                this.current_character_runner = character;
            }
        }
        if (this.current_character_runner === null) {
            this.current_character_runner = new CharacterRunner(this.user_id, character_id, character_list[index], this, this.app_functions)
            this.loaded_character_list.push(this.current_character_runner);
        }
        this.current_character_runner.assign_api_key(this.api_key);
        return this.current_character_runner.m_chat_core.messages;
    }

    async request_chat_history() {
        // might make it async
        if (this.current_character_runner == null) {
            return []
        }
        const chat_history = await this.current_character_runner.request_chat_history()
        return chat_history
        // return await this.current_character_runner.get_chat_history()
    }

    delete_all_chat() {
        if (this.current_character_runner !== null) {
            return this.current_character_runner.delete_all_chat();
        }
    }

    delete_selected_chat(index_list) {
        if (this.current_character_runner !== null && index_list.length > 0) {
            return this.current_character_runner.delete_selected_chat(index_list);
        }
    }

    update_a_message(message, content) {
        if (this.current_character_runner !== null) {
            this.current_character_runner.update_a_message(message, content);
        }
    }

    get_index_of_list_of_messages(message_list) {
        if (this.current_character_runner !== null) {
            return this.current_character_runner.get_index_of_list_of_messages(message_list);
        } else {
            return [];
        }
    }

    get_all_chat() {
        if (this.current_character_runner !== null) {
            return this.current_character_runner.get_all_chat();
        }
        return [];
    }

    get_all_current_conversation() {
        if (this.current_character_runner !== null) {
            return this.current_character_runner.m_chat_core.messages;
        }
        // use to return null. but [] is more genereal
        return [];
    }

    get_current_animation_frame(default_image = null) {
        const frame = this.current_character_runner.animation_controller.getFrame();
        if (frame) {
            return frame
        }
        return default_image
    }

    // call this on a static rate, for example every 0.3 seconds
    update() {
        if (this.current_character_runner !== null) {
            const out = this.current_character_runner.update();
            this.number_of_messages = this.current_character_runner.get_all_chat().length
            return out
        }
        return null;
    }

    // for all user input, input from here
    user_input(text) {
        this.can_reinforce = true;
        if (this.current_character_runner !== null) {
            this.current_character_runner.user_input(text)
            this.number_of_messages = this.current_character_runner.get_all_chat().length
        }
    }

    reinform_character_identity() {
        this.can_reinforce = false;
        if (this.current_character_runner !== null) {
            this.current_character_runner.reinform_character_identity();
        }
    }

    // call this on close or switch conversation character
    end_conversation() {
        if (this.current_character_runner !== null) {
            this.current_character_runner.chat_end();
            this.current_character_runner = null;
        }
    }

    // save all the relational progress to the server
    save_prograss() {
        if (this.current_character_runner !== null) {
            this.current_character_runner.record_the_progress()
        }
    }

    // get all chat history if the character exist
    get_previous_chat_history_from_current_character(time_step = 0) {
        if (this.current_character_runner !== null) {
            return this.current_character_runner.get_previous_chat_history(time_step);
        }
        return null
    }
}

