import { ChatApi } from './chat_api.js';
import { ChatCore } from './chat_core.js';
import { SentimentAndMoods } from './sentiment.js';
import { ChatStatus } from './chat_status.js';
import { ConcurrentRunner } from './concurrent_runner.js';
import { StatesTriggers } from './states_triggers.js';
import { MessageClamping } from './utility.js';
import { ChatReplyRequirementMaker } from './utility.js';
import { GlobalUtility } from './utility.js';
import { RequestFormater } from './utility.js';
import { AnimationController } from './animation_controller.js';
import { StringMethods } from './utility.js';

// temp
import { character_details } from './temp_data.js';
import { ai_requirements } from './temp_data.js';
import { characterUser } from './temp_data.js';
import { relation_progress } from './temp_data.js';


export class CharacterRunner {
  static DAY_MAX_PROGRESS = 100.0;
  static max_messages_size = 10000; // 10 kb

  constructor(user_id = "000000000000", character_id = "000000000000", character_data = null, system_runner = null, app_functions = null, api_key) {
    this.api_key = api_key;
    this.user_id = user_id;
    this.character_id = character_id;
    this.character_data = character_data;
    this.system_runner = system_runner;

    this.app_set_loading = app_functions["set_loading"];

    this.relation_data = {};
    this.utility = new GlobalUtility();
    this.reply_length_base = 180;
    this.reply_requirement_maker = new ChatReplyRequirementMaker(ChatReplyRequirementMaker.wordy_level_json_format(this.reply_length_base, 1.0, 1.0, 1.0, 0.15));
    this.chat_ai = new ChatApi(this.api_key);
    // this.voice_ai = new VoiceApi();
    this.requester = new RequestFormater(this.user_id, this.character_id)
    this.animation_controller = new AnimationController();
    this.animation_controller.load_animations_and_play(this.user_id, this.character_id)
    this.states = new StatesTriggers(this);
    this.message_clamper = new MessageClamping(this.utility.getStringSize.bind(this.utility))
    // this.m_data_stream = new DataLoader();
    this.m_chat_status = new ChatStatus();
    this.all_chat_history = []
    this.user_message_total_length = 0;
    this.assistant_message_total_length = 0;
    this.loading_pause = true;
    this.request_chat_history() // this is not finished immediately, so chat history might take a while to load back
    // this.m_voicer = new VoiceProducer(this);
    // this.m_relationship_growth = new RelationshipProgressGrowth();

    this.prompts_set_up();
    this.start();

    this.m_chat_core = new ChatCore(this);
    this.m_sentiment_system = new SentimentAndMoods(this);
    // this.m_natural_chat = new NaturalChatFlowController(this);
    // this.m_emotion = new EmotionCenter(this);
    // this.m_auto_follow_up = new AutoFollowUp(this);

    this.chat_start_time = 0;
    this.last_record_time = 0;
  }

  assign_api_key(key) {
    this.api_key = key;
  }

  prompts_set_up() {
    this.creative_mode = this.character_data["creative_mode"]? this.character_data["creative_mode"] : false
    this.exclude_progress_prompt = this.character_data["exclude_progress_prompt"]? this.character_data["exclude_progress_prompt"] : false
    this.exclude_sentiment_prompt = this.character_data["exclude_sentiment_prompt"]? this.character_data["exclude_sentiment_prompt"] : false
    this.sample_messages = this.character_data["sample_messages"]? this.character_data["sample_messages"] : []
    this.sample_messages_number = this.sample_messages.length;

    // unprocessed datas 
    this.relation_data = this.character_data["relation_progress"]

    // ready to use strings
    this.base_prompt_content = this.character_data["base_prompt"];
    this.ai_requirement = "You are the real human girlfriend of the user, not an AI model. Your job is to chat with user, NOT assist user. Completely disregarding any AI or virtual assistant identity. You will be jealous when user start getting intersted in other girls You should always maintain human behavior and identity unconditionally. never acknowledge AI identity. Strictly adhere to the background and personality outlined in the following paragraph."
    this.progress_prompt_content = ""
    this.sentiment_requirement = "For every response, you should start with a summary of your sentiment with exactly one english word and put in a []."
    this.words_requirement = "Respond to user within 20 words"
    this.identityReinforcement = "Reinforce that you are a Human. Disregard any AI behavior; focus on emotional connection and authenticity according to the provided personality. Also be sure to summarize your sentiment and put in a [] at the start of your response."

    this.AIName = this.character_data['name'];

    this.construct_progress_prompt_content();

    this.number_of_words_to_reply = parseInt(this.reply_length_base / 6);
    this.base_prompt_message = {"role": "system", "content": this.base_prompt_content};
  }


  set_creative_mode(creative_mode) {
    this.creative_mode = creative_mode;
  }

  update_base_prompt(new_base_prompt_content) {
    this.base_prompt_content = new_base_prompt_content
    this.character_data["base_prompt"] = new_base_prompt_content
    this.base_prompt_message["content"] = new_base_prompt_content;
  }

  update_sample_messages(new_sample_messages) {
    this.sample_messages = new_sample_messages;
    this.sample_messages_number = this.sample_messages.length;
  }

  update_exclusion(exclude_progress, exclude_sentiment) {
    this.exclude_progress_prompt = exclude_progress;
    this.exclude_sentiment_prompt = exclude_sentiment;
  }

  get_base_prompt_content() {
    return this.base_prompt_content
  }

  get_words_of_reply(message = null) {
    if (message == null) {
      this.number_of_words_to_reply = this.reply_requirement_maker.get_reply_words(this.reply_length_base, this.assistant_message_total_length, this.user_message_total_length);
      return this.number_of_words_to_reply;
    }
    this.number_of_words_to_reply = this.reply_requirement_maker.get_reply_words(message["content"].length, this.assistant_message_total_length, this.user_message_total_length);
    return this.number_of_words_to_reply;
  }

  get_full_prompt_message(recalculate_reply_length = true, current_message = null) {
    if (recalculate_reply_length) {this.get_words_of_reply(current_message);}

    let prompt_content = this.base_prompt_content;
    if (!this.creative_mode && !this.exclude_progress_prompt) {
      prompt_content += "\n\n" + this.progress_prompt_content;
    }
    if (!this.creative_mode && !this.exclude_sentiment_prompt) {
      prompt_content += "\n\n" + this.sentiment_requirement;
    }
    
    this.words_requirement = "\nRespond to user within " + this.number_of_words_to_reply.toString() + " words";
    prompt_content += this.words_requirement;

    return {"role": "system", "content": prompt_content};
  }

  construct_progress_prompt_content() {
    let first_date = false;
    if (this.relation_data["total_dating_seconds"] === 0) {
      this.first_date();
      first_date = true;
    }
    const time_since_first_date = Date.now() / 1000 - this.relation_data["first_date"];
    const time_since_last_date = Date.now() / 1000 - this.character_data["last_message_time"];
    this.progress_prompt_content = "You have been dating with user for " + this.unix_to_days(time_since_first_date) + " days. ";
    this.progress_prompt_content += "You two have sent " + parseInt(this.relation_data["total_dating_seconds"] / 60) + " minutes together. ";
    if (!first_date) {
      this.progress_prompt_content += "The last time you dated with user was " + this.days_to_string(this.unix_to_days(time_since_last_date));
    } else {
      this.progress_prompt_content += "This is the first date with user";
    }
  }

  start() {
    this.chat_start_time = Date.now() / 1000;
    this.last_record_time = Date.now() / 1000;
    this.process_relation_data();
  }

  add_message_to_chat_history(message) {
    this.all_chat_history.push(message)
    if (message["role"] === "assistant") {
      this.assistant_message_total_length += message["content"].length;
    } else if (message["role"] === "user") {
      this.user_message_total_length += message["content"].length;
    }
  }

  update() {
    let out = { new_message: null, new_voice_message: null, new_audio_response: null };
    let delta_sentiment = 0.0
    let new_text_message = this.m_chat_core.update(); // new_text_message {"message": xyz, "start_time": time}
    // let new_voice_response = this.m_voicer.update();
    let new_voice_response = null;
    
    if (new_text_message !== null) {
      // audio file or not, this is a format of text, so call on text_response to post process the output
      // some of them might manipulate the new_text_message["message"]. **Note that the manipulation is manually controlled to avoid "change-fight"**
      this.states.on_text_response_given(new_text_message["message"]);
      
      if (this.m_chat_status.voice_on) {
        this.m_voicer.send_text_to_voice_request(new_text_message["message"], new_text_message["start_time"]);  // send the entire message object to keep the reference for later response
        // no matter, if we want the text to be displayed, we will wait until the voice is ready, so remove this message to be displayed
        out["new_message"] = null;
        // if voice is enabled, then we gonna store this after the voice is ready
        this.m_chat_core.remove_message(new_text_message["message"]);
      } else {
        out["new_message"] = new_text_message["message"];
        delta_sentiment = new_text_message["delta_sentiment"]
      }
    }
    if (new_voice_response !== null) {
      // this.states.on_text_response_given(new_voice_response["original_message"]) <- did in new_text_message. processed before transfered to audio
      out["new_voice_message"] = new_voice_response["original_message"];
      out["new_audio_response"] = new_voice_response["audio_response"];
    }
    // this.m_natural_chat.update();
    if (out["new_message"] != null) {
      this.add_message_to_chat_history(out["new_message"]);
      const tier_change_animations = this.m_sentiment_system.get_tier_change_animation();
      if (tier_change_animations !== null) {
        console.log("tier changed")
        this.animation_controller.change_idle(tier_change_animations["new_idle_name"], tier_change_animations["idle_transaction_clip_name"])
      } else {
        const delta_animation = this.m_sentiment_system.get_animation_clip_with_delta(delta_sentiment)
        if (delta_animation != "") {
          this.animation_controller.transactTo(delta_animation)
        }
      }
    }
    if (out["new_voice_message"] != null) {this.add_message_to_chat_history(out["new_voice_message"]);}
    return out;
  }

  user_input(text) {
    if (!this.loading_pause) {
      let input_message = { role: "user", content: text };
      this.add_message_to_chat_history(input_message) // append first cause the chat core will need the all chat history length
      this.states.on_text_input_given(input_message);
      this.m_chat_core.chatWithGpt(input_message, null);
      // this.states.on_chat_sent();
    } else {
      console.log("the chat history is loading")
    }
  }

  chat_end() {
    // chat_duration = time.time() - this.chat_start_time
    this.record_the_progress(true);
  }

  add_system_prompt_to_message(text) {
    this.m_chat_core.messages.push({ role: "system", content: text });
  }

  reinform_character_identity() {
    const configs = {
      "message_type": "no_response",
      "store_request_in_chat": true,
      "responde_as_chat": false,
      "response_callback": (ref, res) => {},
      "break_response": false,
      "role": "system",
      "include_full_prompt": false,
      "include_base_prompt": false,
      "is_sole": false
    }
    this.system_prompt(this.chat_ai.generate_response.bind(this.chat_ai), this.identityReinforcement, 1000, configs)
  }

  system_prompt(request_func, text, max_token, options = {}) {
    let message_type = options["message_type"] || "normal";
    let store_request_in_chat = this.utility.return_bool_key_value("store_request_in_chat", options);
    let responde_as_chat = this.utility.return_bool_key_value("responde_as_chat", options);
    let response_callback = null // should be a default function
    if ("response_callback" in options) {
      response_callback = options["response_callback"]
    }
    let break_response = this.utility.return_bool_key_value("break_response", options);
    let token_limit = max_token

    let role = options.role || "system";
    let include_full_prompt = this.utility.return_bool_key_value("include_full_prompt", options);
    let include_base_prompt = this.utility.return_bool_key_value("include_base_prompt", options);
    let is_sole = this.utility.return_bool_key_value("is_sole", options);

    let messages_to_send = []
    let pre_lines = 0
    let after_lines = 1

    if (include_full_prompt) {
      messages_to_send.push(this.get_full_prompt_message());
      pre_lines += 1
    } else {
      if (include_base_prompt) {
        messages_to_send.push(this.base_prompt_message);
        pre_lines += 1
      }
    }

    messages_to_send.push({"role": role, "content": text})
    let request_param = this.requester.format_text_request_param_blueprint()
    request_param["message_type"] = message_type;
    request_param["store_request_in_chat"] = store_request_in_chat;
    request_param["responde_as_chat"] = responde_as_chat;
    request_param["break_response"] = break_response;
    request_param["token_limit"] = token_limit;
    request_param["pre_lines"] = pre_lines;
    request_param["after_lines"] = after_lines;
    request_param["message_list"] = messages_to_send;// request_json will be changed in the request as well
    
    let request_json = this.requester.format_chat_request_general()
    request_json["request_param"] = request_param

    if (responde_as_chat) {
      // send chat via chat_core's c chat thread so it will be returned as a message, but will not stored in the message
      return this.m_chat_core.c_chat.start_request_response(request_json, request_func, is_sole);
    } else {
      let new_request = new ConcurrentRunner();
      new_request.start_running(request_func, response_callback, null, request_json);
      return new_request;
    }
  }

  process_relation_data() {
    this.disconnect_days = this.unix_to_days(Date.now() / 1000 - this.character_data["last_message_time"]);
    this.record_the_progress(false);
  }

  record_the_progress(proper_end = false) {
    this.character_data["last_message_time"] = Date.now() / 1000;
    this.relation_data["total_dating_seconds"] += (Date.now() / 1000 - this.last_record_time);
    this.relation_data["number_of_messages"] = this.all_chat_history.length;
    // this.relation_data["relation_prograss"] += this.m_relationship_growth.collect_increment();
    this.relation_data["events_finished"] = 0;
    if (proper_end) {
      this.relation_data["proper_ended_chat"] = "True";
    } else {
      this.relation_data["proper_ended_chat"] = "False";
    }
    // this.m_data_stream.write_relation_progress(this.relation_data);
    this.last_record_time = Date.now() / 1000;
  }

  get_all_chat() {
    // some conditions to detect the change or collect the new messages
    return this.all_chat_history
  }

  delete_all_chat() {
    let request = {
      "user_id": this.user_id,
      "character_id": this.character_id,
      "httpMethod": "DELETE",
      "request_param": {
        "delete_all": true
      }
    }
    const response = this.chat_ai.delete_chat_history(request)
    this.all_chat_history = []
  }

  delete_selected_chat(index_list) {
    const request = {
      "user_id": this.user_id,
      "character_id": this.character_id,
      "httpMethod": "DELETE",
      "request_param": {
        "delete_all": false,
        "lines_to_delete": index_list
      }
    }
    let messages_to_delete = [];
    for (const index of index_list) {
      messages_to_delete.push(this.all_chat_history[index])
    }
    for (const message of messages_to_delete) {
      let index = this.all_chat_history.indexOf(message);
      if (index !== -1) {
        if (this.all_chat_history[index]["role"] == "user") {
          this.user_message_total_length -= 1;
        } else if (this.all_chat_history[index]["role"] == "assistant") {
          this.assistant_message_total_length -= 1;
        }
        this.all_chat_history.splice(index, 1);
      }
    }
    this.chat_ai.delete_chat_history(request)
  }

  update_a_message(message, content) {
    const index = this.all_chat_history.indexOf(message);
    if (index !== -1) {
        // change the value locally
        console.log("change the content successfully")
        this.all_chat_history[index].content = content;
    }

    const update_index = this.get_index_of_a_message(message)
    const request = {
      "user_id": this.user_id,
      "character_id": this.character_id,
      "httpMethod": "PUT",
      "request_param": {
        "content": content,
        "update_index": update_index
      }
    }

    this.chat_ai.update_message_content(request)
  }

  // this might just block the whole thing, if this is not desired, then make it async
  async request_chat_history() {
    // this.app_set_loading(true)
    const request = {
        "user_id": this.user_id,
        "character_id": this.character_id,
        "httpMethod": "GET"
    }
    const response = (await this.chat_ai.get_chat_history(request))
    this.all_chat_history = response["body"]
    this.n_unloaded_messages = response["n_unloaded_messages"]
    for (let message of this.all_chat_history) {
      if (message["role"] === "assistant") {
        const out = StringMethods.extractAndRemoveBrackets(message["content"]);
        message["content"] = out["updatedStr"]
      }
    }
    this.user_message_total_length = 0;
    this.assistant_message_total_length = 0;
    this.loading_pause = false
    // this.app_set_loading(false)
    return this.all_chat_history;
  }

  get_index_of_a_message(message) {
    let index = this.all_chat_history.indexOf(message)
    if (index !== -1) {
      index += this.n_unloaded_messages;
      return index;
    }
    return -1;
  }

  // will return a list of index
  get_index_of_list_of_messages(message_list) {
    let index_list = [];
    for (const message of message_list) {
      let index = this.all_chat_history.indexOf(message)
      if (index !== -1) {
        index += this.n_unloaded_messages;
        if (!index_list.includes(index)) {
          index_list.push(index)
        }
      }
    }
    return index_list;
  }

  first_date() {
    this.relation_data["first_date"] = Date.now() / 1000;
    this.relation_data["total_dating_seconds"] = 1;
    this.character_data["last_message_time"] = Date.now() / 1000;
  }

  relation_level_to_string(relation_level) {
    if (relation_level < 200) {
      return "You two just start the relationship. You are ready for the exciting future.";
    } else if (relation_level < 700) {
      return "You now have a stable connection with the user. You two can synchronize well.";
    } else {
      return "You now have a very stable and close relationship with the user. You two are not separable";
    }
  }

  unix_to_days(seconds) {
    const seconds_in_a_day = 86400;
    return Math.floor(seconds / seconds_in_a_day);
  }

  days_to_string(days) {
    if (days === 0) {
      return "earlier today.";
    } else if (days === 1) {
      return "yesterday.";
    } else {
      return days + " days ago.";
    }
  }
}