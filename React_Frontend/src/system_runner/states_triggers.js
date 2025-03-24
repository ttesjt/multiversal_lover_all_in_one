export class StatesTriggers {
    constructor(runner_reference) {
      this.runner = runner_reference;
      this.on_text_input_given_func = [];
      this.on_text_response_given_func = [];
      this.on_input_change_func = [];
      this.on_ai_away_func = [];
    }
  
    on_text_input_given(input_message) {
      for (let func of this.on_text_input_given_func) {
        func(input_message);
      }
    }
  
    add_to_on_text_input_given(new_function) {
      this.on_text_input_given_func.push(new_function);
    }
  
    on_text_response_given(output_message) {
      for (let func of this.on_text_response_given_func) {
        func(output_message);
      }
    }
  
    add_to_on_text_response_given(new_function) {
      this.on_text_response_given_func.push(new_function);
    }
  
    on_input_change() {
      for (let func of this.on_input_change_func) {
        func();
      }
    }
  
    add_to_on_input_change(new_function) {
      this.on_input_change_func.push(new_function);
    }
  
    on_ai_away() {
      for (let func of this.on_ai_away_func) {
        func();
      }
    }
  
    add_to_on_ai_away(new_function) {
      this.on_ai_away_func.push(new_function);
    }
  }