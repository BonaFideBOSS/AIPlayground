from flask import Blueprint, render_template

views = Blueprint("views", __name__)


@views.route("/")
def home():
    return render_template("home.html")


@views.route("/model")
def pretrained():
    return render_template("pretrained.html")


@views.route("/train")
def custom():
    return render_template("custom.html")


@views.route("/model/aichat/")
def aichat():
    return render_template("model/aichat.html")


@views.route("/model/text-to-image/")
def text_to_image():
    return render_template("model/text-to-image.html")


@views.route("/model/qna/")
def qna():
    return render_template("model/qna.html")


@views.route("/train/image-classification/")
def image_classification():
    return render_template("train/image_classification.html")
