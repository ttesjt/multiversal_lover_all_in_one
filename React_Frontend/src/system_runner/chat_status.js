export class ChatStatus {
  constructor() {
    this.is_away = false;
    this.voice_on = false;
    this.current_mood = "Neutral";
    this.chat_duration = 0;
    this.last_user_input_time = 0;
    this.last_user_input_change_time = 0;
  }

  user_input_is_given() {
    this.last_user_input_time = Date.now();
  }

  user_input_is_changed() {
    this.last_user_input_change_time = Date.now();
  }

  get_last_input_time_diff() {
    return Date.now() - this.last_user_input_time;
  }

  get_last_input_change_time_diff() {
    return Date.now() - this.last_user_input_change_time;
  }

  set_away(away) {
    this.is_away = away;
  }

  initialization() {
    this.is_away = false;
    this.current_mood = "Neutral";
    this.chat_duration = 0;
  }
}