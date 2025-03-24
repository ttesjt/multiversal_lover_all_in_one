from library import main_runner
from flask import Flask, request, jsonify

app = Flask(__name__)

STATUS_OK = 200
STATUS_BAD_REQUEST = 400
STATUS_INTERNAL_ERROR = 500

MSG_OK = "OK"
MSG_BAD_REQUEST = "Invalid request"
MSG_INTERNAL_ERROR = "Internal error"
MSG_DATA_UPDATED = "Data updated"

runner = main_runner.MainRunner()

@app.route('/', methods=['POST', 'GET'])
def my_route():
    print("is inside of here ohoh")
    response_body = {
        "statusCode": 500,
        "message": "Internal Error"
    }
    if request.method == 'POST':
        # send text
        if request.json is None or 'text_input' not in request.json:
            print("bad request=========================")
            response_body['statusCode'] = 400
            response_body['message'] = "Invalid post request: missing required parameter 'text_input' (string) or it equal to null"
        else:
            runner.user_input(request.json['text_input'])
            response_body['statusCode'] = 201
            response_body['message'] = "You made it yes!!"
    elif request.method == 'GET':
        # refresh
        print("right here")
        out = runner.update()
        response_body['statusCode'] = 200
        response_body['message'] = "Here is the data, though it might be empty"
        response_body['body'] = out
    return jsonify(response_body)

@app.route('/reinitialization', methods=['POST','GET'])
def re_initialization():
    runner = main_runner.MainRunner()
    return "success"

if __name__ == '__main__':
    app.run(debug=True)

