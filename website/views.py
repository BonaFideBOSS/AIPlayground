from flask import Blueprint, render_template

views = Blueprint("views", __name__)

clients = []


@views.route("/")
def home():
    return render_template("home.html")


@views.route("/image-classification")
def image_classification():
    return render_template("image_classification.html")
