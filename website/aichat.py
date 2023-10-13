from flask import Blueprint, request, session
import google.generativeai as palm
import os
from . import socketio
from flask_socketio import emit

aichat = Blueprint("aichat", __name__)

PALM_API = os.environ.get("PALM_API")
palm.configure(api_key=PALM_API)


@socketio.on("message")
def handle_message(messages):
    response = ""
    try:
        response = new_message(messages)
        if not response:
            response = "Failed to generate response."
    except Exception as e:
        response = "An unknown error occured."
        print(e)
    emit("ai_response", response, to=request.sid)


def new_message(messages):
    response = palm.chat(messages=messages)
    return response.last
