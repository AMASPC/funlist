import os
import logging
import sys
from datetime import timedelta
from flask import Flask
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from flask_session import Session
from db_init import db, init_db

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

try:
    # Create the app
    logger.info("Creating Flask application...")
    app = Flask(__name__)

    # Setup configurations
    logger.info("Setting up configurations...")
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "dev_key")
    if not app.config["SECRET_KEY"]:
        logger.error("No SECRET_KEY configured!")
        raise ValueError("SECRET_KEY must be set")

    # Database configuration
    logger.info("Configuring database...")
    if not os.environ.get("DATABASE_URL"):
        logger.error("No DATABASE_URL configured!")
        raise ValueError("DATABASE_URL must be set")

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
        "pool_timeout": 30,
        "connect_args": {"connect_timeout": 10}
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ECHO"] = True

    # Session configuration
    logger.info("Setting up session configuration...")
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=14)
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['REMEMBER_COOKIE_HTTPONLY'] = True
    app.config['REMEMBER_COOKIE_SAMESITE'] = 'Lax'

    # Initialize extensions
    logger.info("Initializing Flask extensions...")
    db.init_app(app)
    csrf = CSRFProtect(app)
    Session(app)

    # Initialize database
    logger.info("Initializing database...")
    init_db(app)

    # Setup login manager
    logger.info("Setting up login manager...")
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "login"
    login_manager.login_message = "Please log in to access this page."
    login_manager.login_message_category = "info"
    login_manager.session_protection = "strong"

    # Setup rate limiter
    logger.info("Setting up rate limiter...")
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://"
    )

    # Import models and routes after app initialization to avoid circular imports
    logger.info("Importing models...")
    from models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Initialize routes
    logger.info("Initializing routes...")
    from routes import init_routes
    init_routes(app)

    logger.info("Application initialization completed successfully!")

except Exception as e:
    logger.error(f"Error during application startup: {str(e)}", exc_info=True)
    sys.exit(1)

if __name__ == '__main__':
    try:
        logger.info("Starting Flask development server...")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Error starting Flask server: {str(e)}", exc_info=True)
        sys.exit(1)