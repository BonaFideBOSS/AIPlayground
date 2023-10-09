from flask import Flask
import os


def flask_app():
    app = Flask(__name__, template_folder="views", static_folder="assets")

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")

    from .views import views

    app.register_blueprint(views, url_prefix="/")

    return app
