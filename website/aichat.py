from flask import Blueprint, request, session
import google.generativeai as palm
import os

aichat = Blueprint("aichat", __name__)

PALM_API = os.environ.get("PALM_API")
palm.configure(api_key=PALM_API)


@aichat.route("/message", methods=["POST"])
def handle_message():
    response = ""
    try:
        messages = request.form.getlist("messages[]")
        response = new_message(messages)
        if not response:
            response = "Failed to generate response."
    except Exception as e:
        response = "An unknown error occured."
        print(e)
    return response


def new_message(messages):
    response = palm.chat(messages=messages)
    return response.last
