from flask import Blueprint, request, session

aiart = Blueprint("aiart", __name__)


@aiart.route("/add-to-session", methods=["POST"])
def add_to_session():
    try:
        images = []
        db = request.form.get("db", type=str)
        image = request.form.get("image", type=str)

        if db in session:
            images = session[db]
        images.append(image)
        session[db] = images
        session.permanent = True

    except Exception as e:
        print(e)
    return "", 204
