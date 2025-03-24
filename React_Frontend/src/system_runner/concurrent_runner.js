import { GlobalUtility } from './utility.js';
import { TextModification } from './utility.js';


export class ConcurrentRunner {
  constructor() {
    this.runningPromise = null;
    this.termination = null;
    this.reference = null;
  }

  isAsync(func) {
    return func.constructor.name === "AsyncFunction";
  }

  /* start_running(func, termination, reference, ...args) {
    if (this.runningPromise !== null) {
      return;
    }
    this.termination = termination;
    this.reference = reference;
    console.log(func);
    this.runningPromise = (async () => {
      try {
        let result;
        if (this.isAsync(func)) {
          result = await func(...args);
        } else {
          result = func(...args);
        }
        console.log("resolved promiss ", result);
        if (this.termination !== null) {
          this.termination(this.reference, result);
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.runningPromise = null;
      }
    })();
  }*/

  start_running(func, termination, reference, ...args) {
    if (this.runningPromise !== null) {
      return;
    }
    this.termination = termination;
    this.reference = reference;
    this.runningPromise = Promise.resolve()
      .then(() => {
        return func(...args)
      })
      .then(result => {
        if (this.termination !== null) {
          this.termination(this.reference, result);
        }
        this.runningPromise = null;
      })
      .catch(error => {
        console.error(error);
        this.runningPromise = null;
      });
  }

  stop_running() {
    if (this.runningPromise !== null) {
      this.runningPromise = null;
      if (this.termination !== null) {
        this.termination(this.reference);
        this.termination = null;
        this.reference = null;
      }
    }
  }
}


export class ConcurrentOrgnizer {
  constructor(max_pending_response = 3) {
    this.max_pending_response = max_pending_response;
    this.pending_responses = [];
    this.all_requests = [];
    this.latest_displayed_response_start_time = 0;
  }

  get_response(get_full_data = false, get_all = false) {
    if (get_all) {
      const result = [];
      for (const p_r of this.pending_responses) {
        result.push(p_r.response);
        this.latest_displayed_response_start_time = p_r.start_time;
      }
      this.pending_responses = [];
      return result;
    } else if (this.pending_responses.length > 0) {
      this.latest_displayed_response_start_time = this.pending_responses[0].start_time;
      const first_p_r = this.pending_responses.shift();
      if (get_full_data) {
        return first_p_r;
      }
      return first_p_r.response;
    } else {
      return null;
    }
  }

  response_done(list_reference = null, response = null) {
    if (response !== null && list_reference && list_reference.start_time > this.latest_displayed_response_start_time) {
      const position = this.pending_responses.findIndex(item => item.start_time > list_reference.start_time);
      // if the checked index starts later than the current one, insert the current one before the checked index
      if (position >= 0) {
        this.pending_responses.splice(position, 0, {response: response, start_time: list_reference.start_time});
      } else {
        this.pending_responses.push({response: response, start_time: list_reference.start_time});
      }
    }
    this.all_requests = this.all_requests.filter(item => item !== list_reference);
  }

  start_request_response(request_to_send, request_func, sole_exist = false) {
    for (const request of this.all_requests) {
      if (request.sole_exist) {
        request.thread.stop_running();
      }
    }
    const new_request = new ConcurrentRunner();
    const request_wrap_object = {thread: new_request, start_time: Date.now(), sole_exist};
    this.all_requests.push(request_wrap_object);
    // in js, when we try to pass a function from a class. we need bind(this)
    new_request.start_running(request_func, this.response_done.bind(this), request_wrap_object, request_to_send);
  
    while (this.all_requests.length > this.max_pending_response) {
      this.all_requests[0].thread.stop_running();
    }
    // return the function runner, so if want to keep a ref of a request, and check the individual status, use this one.
    return new_request;
  }

  start_request_response_customized_start_time(request_to_send, request_func, start_time, sole_exist = false) {
    for (const request of this.all_requests) {
      if (request.sole_exist) {
        request.thread.stop_running();
      }
    }
    const new_request = new ConcurrentRunner();
    const request_wrap_object = {thread: new_request, start_time, sole_exist};
    // in js, when we try to pass a function from a class. we need bind(this)
    new_request.start_running(request_func, this.response_done.bind(this), request_wrap_object, request_to_send);
  
    // Insert the new wrapped object into the list at the right position
    const position = this.all_requests.findIndex(item => item.start_time > request_wrap_object.start_time);
    if (position >= 0) {
      this.all_requests.splice(position, 0, request_wrap_object);
    } else {
      this.all_requests.push(request_wrap_object);
    }
  
    while (this.all_requests.length > this.max_pending_response) {
      this.all_requests[0].thread.stop_running();
    }
    // return the function runner, so if want to keep a ref of a request, and check the individual status, use this one.
    return new_request;
  }
}

export class ConcurrentOrgnizerForMessages extends ConcurrentOrgnizer {
  constructor(max_pending_response = 3, response_additional_callback = null) {
    super(max_pending_response);
    this.text_modifier = new TextModification();
    this.utility = new GlobalUtility()
    this.response_additional_callback = response_additional_callback;
  }

  response_done(list_reference, response) {
    if (response && response["body"] && typeof response["body"] !== "string") {
      if (this.response_additional_callback) {this.response_additional_callback(response)}
      if (list_reference !== null && list_reference.start_time > this.latest_displayed_response_start_time) {
        let position = this.pending_responses.findIndex(item => item.start_time > list_reference.start_time);
        let message_list = this.utility.unwrap_response_to_message_list(response)
        if (position < 0) {
          position = this.pending_responses.length;
        }
        // check if the message is broken to list by checking if the list is empty
        if (message_list === null || message_list.length === 0) {
          this.pending_responses.splice(position, 0, {response: response, start_time: list_reference.start_time});
        } else {
          this.insert_message_list_as_fake_responses(list_reference, message_list, position);
        }
      }
    }
    this.all_requests = this.all_requests.filter(request => request !== list_reference);
  }

  insert_message_list_as_fake_responses(list_reference, message_list, index) {
    for (let message of message_list) {
      // maybe add a clone
      const new_response = this.utility.wrap_message_to_fake_response(message);
      this.pending_responses.splice(index, 0, {
        response: new_response,
        start_time: list_reference.start_time
      });
      index += 1;
    }
  }
}

