import { Config } from './config.js';

export class ChatApi {
    constructor(apiKey = "") {
      this.apiKey = apiKey;
    }

    generate_response(request_json) {
      const response = this.sendRequest(request_json);
      // const response = this.sendRequest(message_being_sent, "normal", 1500, pre_lines, 0);
      return response
    }

    get_chat_history(request_json) {
      request_json["httpMethod"] = "GET"
      if (Config.api_key != "") {request_json["openai_api"] = Config.api_key}
      return fetch('https://p8al26soqe.execute-api.us-west-1.amazonaws.com/Chat_Live', {
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

    update_message_content(request_json) {
      request_json["httpMethod"] = "PUT"
      if (Config.api_key != "") {request_json["openai_api"] = Config.api_key}
      return fetch('https://p8al26soqe.execute-api.us-west-1.amazonaws.com/Chat_Live', {
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

    delete_chat_history(request_json) {
      request_json["httpMethod"] = "DELETE"
      if (Config.api_key != "") {request_json["openai_api"] = Config.api_key}
      return fetch('https://p8al26soqe.execute-api.us-west-1.amazonaws.com/Chat_Live', {
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

    sendRequest(request_json) {
      if (Config.api_key != "") {request_json["openai_api"] = Config.api_key}
      console.log("openai_api: ", Config.api_key)
      return fetch('https://p8al26soqe.execute-api.us-west-1.amazonaws.com/Chat_Live', {
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