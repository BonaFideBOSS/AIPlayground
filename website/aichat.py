from flask import Blueprint, request, session
import google.generativeai as palm
import os

aichat = Blueprint("aichat", __name__)

PALM_API = os.environ.get("PALM_API")
palm.configure(api_key=PALM_API)


@aichat.route("/message", methods=["POST"])
def message():
    response = ""
    try:
        messages = []
        if "aichat" in session:
            messages = session["aichat"]

        message = request.form.get("message", type=str)
        messages.append(message)

        chat = palm.chat(messages=messages)
        response = chat.last

        if not response:
            response = "An unknown error occured."

        messages.append(response)
        session["aichat"] = messages
        session.permanent = True

    except Exception as e:
        print(e)
    return response


@aichat.route("/history")
def chat_history():
    history = []
    try:
        if "aichat" in session:
            history = session["aichat"]
    except Exception as e:
        print(e)
    return history
