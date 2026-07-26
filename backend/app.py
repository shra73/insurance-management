import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from extensions import db, bcrypt, jwt

app = Flask(__name__)
CORS(app)

app.config.from_object(Config)

# Ensure the upload directory exists at startup, rather than failing
# on the first upload request.
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
migrate = Migrate(app, db)

# Import models
from models.user import User
from models.customer import Customer
from models.policy import Policy
from models.premium import PremiumPayment
from models.claim import Claim
from models.document import Document

# Register blueprints
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.customer import customer_bp
from routes.policy import policy_bp
from routes.premium import premium_bp
from routes.claim import claim_bp
from routes.document import document_bp
from routes.report import report_bp


app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(policy_bp)
app.register_blueprint(premium_bp)
app.register_blueprint(claim_bp)
app.register_blueprint(document_bp)
app.register_blueprint(report_bp)

# Flask raises a built-in 413 when MAX_CONTENT_LENGTH is exceeded, but by
# default it returns an HTML error page, not JSON. This handler converts
# it to a clean JSON response, consistent with every other error in this API.
@app.errorhandler(413)
def handle_file_too_large(e):
    return jsonify({
        "error": f"Uploaded file exceeds the maximum allowed size of "
                 f"{app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)} MB"
    }), 413


@app.route('/')
def home():
    return {'message': 'Insurance API is running'}


if __name__ == '__main__':
    print('Starting Flask server...')
    app.run(debug=True, port=5000)
    