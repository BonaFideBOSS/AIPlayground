from flask import Flask
import os


def flask_app():
    app = Flask(__name__, template_folder="views", static_folder="assets")
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")

    from .views import views
    from .aichat import aichat
    from .aiart import aiart

    app.register_blueprint(views, url_prefix="/")
    app.register_blueprint(aichat, url_prefix="/aichat")
    app.register_blueprint(aiart, url_prefix="/aiart")

    return app
