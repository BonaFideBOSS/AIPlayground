from website import flask_app
from flask import render_template

app = flask_app()

if __name__ == "__main__":
    app.run()


# ===== Error Handling =====
@app.errorhandler(Exception)
def page_not_found(e):
    return render_template("404.html")
