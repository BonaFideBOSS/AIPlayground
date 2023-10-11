from flask import Blueprint, request
import google.generativeai as palm
import os

aichat = Blueprint("aichat", __name__)

PALM_API = os.environ.get("PALM_API")
palm.configure(api_key=PALM_API)


@aichat.route("/new", methods=["POST"])
def new_conversation():
    try:
        message = request.form.get("message", type=str)
        response = palm.chat(messages=message)
        if response.last:
            return response.last
    except Exception as e:
        print(e)
    return "An error occured. Please try again."
