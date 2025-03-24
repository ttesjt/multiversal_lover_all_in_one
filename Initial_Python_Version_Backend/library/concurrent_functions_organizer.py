import time
import bisect
from library import concurrent_function_runner
from library import utility

class ConcurrentOrgnizer:
    def __init__(self, max_pending_response=3):
        self.max_pending_response = max_pending_response
        self.pending_responses = []
        self.all_requests = []
        self.latest_displayed_response_start_time = 0

    def get_response(self, get_full_data = False, get_all=False):
        if get_all:
            result = []
            for p_r in self.pending_responses:
                result.append(p_r["response"])
                self.latest_displayed_response_start_time = p_r["start_time"]
            self.pending_responses = []
            return result
        elif len(self.pending_responses) > 0:
            self.latest_displayed_response_start_time = self.pending_responses[0]["start_time"]
            first_p_r = self.pending_responses[0]
            self.pending_responses.remove(first_p_r)
            if (get_full_data):
                return first_p_r
            return first_p_r["response"]
        else:
            return None

    def response_done(self, list_reference=None, response=None):
        if response is not None and list_reference and list_reference["start_time"] > self.latest_displayed_response_start_time:
            position = bisect.bisect([item["start_time"] for item in self.pending_responses], list_reference["start_time"])
            self.pending_responses.insert(position, {"response": response, "start_time": list_reference["start_time"]})
        self.all_requests.remove(list_reference)

    # returns the request that was created
    def start_request_response(self, request_to_send, request_func, sole_exist=False):
        for request in self.all_requests:
            if request["sole_exist"]:
                request["thread"].stop_running()

        new_request = concurrent_function_runner.ConcurrentRunner()
        request_wrap_object = {"thread": new_request, "start_time": time.time(), "sole_exist": sole_exist}
        self.all_requests.append(request_wrap_object)
        new_request.reference = request_wrap_object
        new_request.start_running(request_func, self.response_done, request_to_send)

        while len(self.all_requests) > self.max_pending_response:
            self.all_requests[0]["thread"].stop_running()
        # return the function runner, so if want to keep a ref of a request, and check the individual status, use this one.
        return new_request
    
    def start_request_response_customized_start_time(self, request_to_send, request_func, start_time, sole_exist=False):
        for request in self.all_requests:
            if request["sole_exist"]:
                request["thread"].stop_running()

        new_request = concurrent_function_runner.ConcurrentRunner()
        request_wrap_object = {"thread": new_request, "start_time": start_time, "sole_exist": sole_exist}
        # insert the new wrapped object into the list at the right position
        position = bisect.bisect([item["start_time"] for item in self.all_requests], request_wrap_object["start_time"])
        self.all_requests.insert(position, request_wrap_object)
        new_request.reference = request_wrap_object
        new_request.start_running(request_func, self.response_done, request_to_send)

        while len(self.all_requests) > self.max_pending_response:
            print("try remove the front most")
            self.all_requests[0]["thread"].stop_running()
            print("done removing")
        # return the function runner, so if want to keep a ref of a request, and check the individual status, use this one.
        return new_request



class ConcurrentOrgnizerForMessages(ConcurrentOrgnizer):
    def __init__(self, max_pending_response=3):
        super().__init__(max_pending_response)
        self.text_modifier = utility.TextModification()

    def response_done(self, list_reference=None, response=None):
        if response is not None and list_reference and list_reference["start_time"] > self.latest_displayed_response_start_time:
            position = bisect.bisect([item["start_time"] for item in self.pending_responses], list_reference["start_time"])
            self.break_messages_and_insert(list_reference, response, position)
        self.all_requests.remove(list_reference)

    def break_messages_and_insert(self, list_reference, response, index):
        content = response["choices"][0]["message"]["content"]
        role = response["choices"][0]["message"]["role"]
        broken_list = self.text_modifier.separate_text_message(content)
        # broken_list = [content]
        for piece in broken_list:
            # keep the format of the original response
            new_response = {"choices": [{"message": {"role": role, "content": piece}}]}
            self.pending_responses.insert(index, {"response": new_response, "start_time": list_reference["start_time"]})
            index += 1