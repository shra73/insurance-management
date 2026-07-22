from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from extensions import db

app = Flask(__name__)
CORS(app)

# Load configuration (includes DATABASE_URL from .env)
app.config.from_object(Config)

# Initialize database
db.init_app(app)
migrate = Migrate(app, db)

# Import models
from models.user import User
from models.customer import Customer
from models.policy import Policy


@app.route('/')
def home():
    return {'message': 'Insurance API is running'}


if __name__ == '__main__':
    print('Starting Flask server...')
    app.run(debug=True, port=5000)