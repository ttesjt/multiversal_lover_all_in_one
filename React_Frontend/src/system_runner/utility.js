export class MessageClamping {
  // tokenCountMethod should accept a string and return a number
  constructor(tokenCountMethod = null) {
    this.countTokens = tokenCountMethod;
  }

  clampMessages(messages, maxTokenAllowed, preregisteredLines, bottomReregisteredLines) {
    let messageBeingSent = [];
    let totalTokens = 0;

    if (preregisteredLines + bottomReregisteredLines >= messages.length) {
      return messages;
    }

    // Add preregisteredLines messages from the front
    for (let i = 0; i < preregisteredLines; i++) {
      messageBeingSent.push(messages[i]);
      totalTokens += this.countTokens(messages[i].content);
    }

    // Add bottomReregisteredLines messages from the bottom
    let indexFromBottom = messages.length - 1;
    for (let i = 0; i < bottomReregisteredLines; i++) {
      messageBeingSent.push(messages[indexFromBottom]);
      totalTokens += this.countTokens(messages[indexFromBottom].content);
      indexFromBottom -= 1;
    }

    // Add as many messages as possible from the bottom without exceeding maxTokenAllowed
    for (let message of messages.slice(preregisteredLines, indexFromBottom + 1).reverse()) {
      let messageTokens = this.countTokens(message.content);

      if (totalTokens + messageTokens > maxTokenAllowed) {
        break;
      }
      if (!messageBeingSent.includes(message)) {
        messageBeingSent.splice(preregisteredLines, 0, message);
        totalTokens += messageTokens;
      }
    }
    return messageBeingSent
  }

  clampMessages_subtractive(messages, maxTokenAllowed, pre_cut, after_cut) {
    let messageBeingSent = [];
    let totalTokens = 0;

    if (pre_cut + after_cut >= messages.length) {
      return [];
    }

    let indexFromBottom = messages.length - after_cut;

    // Add as many messages as possible from the bottom without exceeding maxTokenAllowed
    for (let message of messages.slice(pre_cut, after_cut).reverse()) {
      let messageTokens = this.countTokens(message.content);

      if (totalTokens + messageTokens > maxTokenAllowed) {
        break;
      }
      if (!messageBeingSent.includes(message)) {
        messageBeingSent.splice(pre_cut, 0, message);
        totalTokens += messageTokens;
      }
    }

    return messageBeingSent
  }
}

export class Mathf{
  static lerpInt(a, b, t) {
    const result = Math.round((1 - t) * a + t * b);
    return result;
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}

export class ChatReplyRequirementMaker{
  constructor(wordy_level_json) {
    this.average_length_to_words = 6
    this.reply_length_base = wordy_level_json["reply_length_base"]
    this.reply_min_length = wordy_level_json["reply_min_length"]
    this.reply_max_length = wordy_level_json["reply_max_length"]
    this.length_ratio_current_message = wordy_level_json["length_ratio_current_request"];
    this.length_ratio_message_history = wordy_level_json["length_ratio_chat_history"];
    this.length_ratio_current_message_weight = wordy_level_json["length_ratio_current_message_weight"];
    this.length_ratio_message_history_weight = wordy_level_json["length_ratio_message_history_weight"];
  }

  get_reply_words(length_of_current_message, length_of_all_reply, length_of_all_request) {
    let reply_length = this.reply_length_base;
    if (this.length_ratio_current_message_weight > 0) {
      const new_length = Mathf.clamp(length_of_current_message * this.length_ratio_current_message, this.reply_min_length, this.reply_max_length);
      reply_length = Mathf.lerpInt(reply_length, new_length, this.length_ratio_current_message_weight)
    }
    if (this.length_ratio_message_history_weight > 0) {
      const length_of_balence = length_of_all_request * this.length_ratio_message_history
      const length_needed_to_the_balence = length_of_balence - length_of_all_reply
      const rationalized_length = Mathf.clamp(length_needed_to_the_balence, this.reply_min_length, this.reply_max_length);
      reply_length = Mathf.lerpInt(reply_length, rationalized_length, this.length_ratio_message_history_weight)
    }
    reply_length = Mathf.clamp(reply_length, this.reply_min_length, this.reply_max_length);
    return parseInt(reply_length / this.average_length_to_words)
  }

  static wordy_level_json_format(length_base, length_ratio_current_request, length_ratio_chat_history, length_ratio_current_message_weight, length_ratio_message_history_weight) {
    return {
      "reply_length_base": length_base,
      "reply_min_length": length_base * 0.55,
      "reply_max_length": length_base * 1.5,
      "length_ratio_current_request": length_ratio_current_request,
      "length_ratio_chat_history": length_ratio_chat_history,
      "length_ratio_current_message_weight": length_ratio_current_message_weight,
      "length_ratio_message_history_weight": length_ratio_message_history_weight
    }
  }
}



export class TextModification {
  constructor() {
    this.standard_length_range = [12, 100];
    this.punctuation_probabilities = {
      ",": 0.2,
      ".": 0.45,
      "!": 0.85,
      "?": 0.85,
    };
  }

  _increase_separation_probability(char_count, base_probability) {
    const complement_prob_addon = (1.0 - base_probability) / 6.0;
    return (Math.atan(char_count / 7.0) * complement_prob_addon) + base_probability;
  }

  _is_last_punctuation(text, index) {
    const remaining_text = text.slice(index + 1);
    for (const char of remaining_text) {
      if (this.punctuation_probabilities.hasOwnProperty(char)) {
        return false;
      }
    }
    return true;
  }

  separate_text_message(text) {
    const separated_messages = [];
    let current_message = "";
    let char_count = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      current_message += char;
      char_count += 1;

      if (this.punctuation_probabilities.hasOwnProperty(char)) {
        if (this._is_last_punctuation(text, i)) {
          break;
        }
        const base_probability = this.punctuation_probabilities[char];
        const probability = this._increase_separation_probability(char_count, base_probability);
        if (Math.random() < probability) {
          separated_messages.push(current_message.trim());
          current_message = "";
          char_count = 0;
        }
      }
    }
    if (current_message.trim()) {
      separated_messages.push(current_message.trim());
    }

    return separated_messages;
  }
}

export class GlobalUtility{
  constructor() {}

  unwrap_response_to_message(response) {
    try {
      let result = response["body"]["message"]
      return result
    } catch (error) {
      return null;
    }
  }

  unwrap_response_to_message_list(response) {
    try {
      let result = response["body"]["message_list"]
      return result
    } catch (error) {
      return [];
    }
  }

  clone_message_to_fake_response(message) {
    try {
      let result = { body: { message: { role: message.role, content: message.content }, message_list: [] } };
      return result
    } catch (error) {
      return null;
    }
  }

  wrap_message_to_fake_response(message) {
    return { body: { message: message, message_list: [] } };
  }

  getStringSize(str) {
    let sizeInBytes = new Blob([str], { type: 'text/plain;charset=utf-8' }).size;
    return sizeInBytes;
  }

  return_bool_key_value(key, dict) {
    if (key in dict) {
      return dict[key];
    }
    return false;
  }
}

export class RequestFormater{
  constructor(user_id = "000", character_id = "000") {
    this.user_id = user_id;
    this.character_id = character_id;
  }

  format_chat_request_general() {
    return {
      "httpMethod": "POST",
      "user_id": this.user_id,
      "character_id": this.character_id,
      "request_type": "text",
      "request_param": null
    }
  }
  
  format_text_request_param_blueprint() {
    return {
      "need_response": true,
      "message_type": "normal",
      "message_list": [
        {
          "role": "system",
          "content": "nothing"
        }
      ],
      "pre_lines": 0,
      "after_lines": 0,
      "token_limit": 1500,
      "store_request_in_chat": true,
      "responde_as_chat": true,
      "break_response": true
    }
  }
  
  // messages must be a list of message
  format_chat_request(messages, break_message = true) {
    let request = this.format_chat_request_general()
    request["request_param"] = this.format_text_request_param_blueprint()
    request["request_param"]["message_list"] = messages
    request["request_param"]["break_response"] = break_message
    return request
  }

  format_character_creation_request(user_id, character_name) {
    const character_details_json = {
      "origin": "",
      "role": "",
      "personality": "",
      "extraNote": "",
      "chatStyle": "",
      "summary": ""
    }
    let request_json = {
      "action": "upload_character",
      "user_id": user_id,
      "character_data": {
        "name": character_name,
        "nickname": "",
        "character_details": character_details_json,
        "creative_mode": false,
        "creative_base_prompt_content": "",
        "exclude_progress_prompt": false,
        "exclude_sentiment_prompt": false,
        "sample_messages": []
      }
    }
    return request_json;
  }
}

export class StringMethods {
  static extractAndRemoveBrackets(inputStr) {
    const regex = /\[(.*?)\]\s?/;
    const match = inputStr.match(regex);

    if (match) {
      const content = match[1];
      const updatedStr = inputStr.replace(regex, '');
      return { content, updatedStr };
    } else {
      return { content: null, updatedStr: inputStr };
    }
  }
}

