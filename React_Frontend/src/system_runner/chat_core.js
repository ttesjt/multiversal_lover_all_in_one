import { ConcurrentOrgnizerForMessages } from './concurrent_runner.js';
import { StringMethods } from './utility.js';

export class ChatCore {
  constructor(runner_reference) {
    this.runner = runner_reference;
    this.c_chat = new ConcurrentOrgnizerForMessages(3, this.runner.system_runner.get_remaining_token_from_response.bind(this.runner.system_runner));

    this.emotion_count = 3;
    this.preregistered_lines = 1;

    this.messages = [];
    this.messages.unshift(this.runner.get_full_prompt_message());
    this.emotion_prompt = "";
    this.last_get_message_time = -100;
    this.min_message_interval_range = [1, 1.4];
    this.min_message_interval = 1;
  }

  get_additional_prelines() {
    let additional_prelines = 0
    if (this.emotion_prompt == "") {
      additional_prelines += 1
    }
    return additional_prelines
  }

  update() {
    // this.emotion_prompt = this.runner.m_emotion.get_emotion_description();
    return this.process_one_new_message();
  }

  // remove a certain message by reference. Can use the reference returned by update
  remove_message(message) {
    this.messages.splice(this.messages.indexOf(message), 1);
  }

  calculate_allowed_token(text) {
    return 1000;
  }

  build_request_json(new_message, additional_prompts = null) {
    let message_being_sent = []
    let pre_lines = 1     // base prompts
    let after_lines = 1   // new message
    message_being_sent.push(this.runner.get_full_prompt_message(true, new_message))
    if (additional_prompts !== null) {
      message_being_sent.push(additional_prompts)
      pre_lines += 1
    }

    message_being_sent = message_being_sent.concat(this.runner.sample_messages);
    pre_lines = message_being_sent.length

    message_being_sent.push(new_message)
    let request_json = this.runner.requester.format_chat_request(message_being_sent)
    request_json["pre_lines"] = pre_lines;
    request_json["after_lines"] = after_lines;
    console.log(request_json)
    return request_json
  }

  chatWithGpt(message, additional_prompts = null) {
    this.messages.push(message);
    let request_json = this.build_request_json(message, additional_prompts)
    /*this.emotion_count -= 1;
    if (this.emotion_count <= 0) {
      let emotion_sent = this.runner.m_emotion.checkConversationVibe(this.messages);
      if (emotion_sent == true) {
        this.emotion_count = 3;
      }
    }*/
    if (!this.runner.m_chat_status.is_away) {
      if (this.runner.m_chat_status.voice_on) {request_json["break_response"] = false;} // voice mode on, means we try to keep a sentence together
      this.c_chat.start_request_response(request_json, (input) => {return this.runner.chat_ai.generate_response(input)});
    }
  }

  // wrap_response(response) {
  //   return { "role": response["choices"][0]["message"]["role"], "content": response["choices"][0]["message"]["content"] };
  // }

  process_one_new_message() {
    if (Date.now() - this.last_get_message_time >= this.min_message_interval * 1000) {
      this.min_message_interval = Math.random() * (this.min_message_interval_range[1] - this.min_message_interval_range[0]) + this.min_message_interval_range[0];
      const newResponse = this.c_chat.get_response(true, false); // ==> {"response": response_obj, "start_time": xyz}
      if (newResponse != null) {
        this.last_get_message_time = Date.now();
        const newMessage = newResponse.response.body.message; // wrap original object to a new object and keep a reference
        this.messages.push(newMessage);
        const delta_mood = this.process_sentiment_clause(newMessage);
        return { "message": newMessage, "start_time": newResponse.start_time, "delta_sentiment": delta_mood};
      }
    }
    return null;
  }

  process_sentiment_clause(message) {
    const str = message["content"]
    let delta_sentiment = 0
    const out = StringMethods.extractAndRemoveBrackets(str);
    if (out["content"] != null) {
      delta_sentiment = this.runner.m_sentiment_system.process_a_input(out["content"].toLowerCase())
    }
    message["content"] = out["updatedStr"]
    return delta_sentiment
  }
}