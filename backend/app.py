from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from extensions import db, bcrypt, jwt

app = Flask(__name__)
CORS(app)

app.config.from_object(Config)

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


# Register blueprints
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.customer import customer_bp
from routes.policy import policy_bp
from routes.premium import premium_bp

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(policy_bp)
app.register_blueprint(premium_bp)


@app.route('/')
def home():
    return {'message': 'Insurance API is running'}


if __name__ == '__main__':
    print('Starting Flask server...')
    app.run(debug=True, port=5000)
    
    

    