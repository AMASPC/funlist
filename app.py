import os
import sys
import logging
import traceback
from datetime import timedelta
from flask import Flask, session, request, render_template
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_session import Session
from db_init import db
from flask_migrate import Migrate
from werkzeug.exceptions import RequestTimeout
from functools import wraps
import time

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format=
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.FileHandler('app.log'),
              logging.StreamHandler()])
logger = logging.getLogger(__name__)


def create_app():
    logger.info("Starting application creation...")
    app = Flask(__name__, static_folder='static')

    # Enhanced configurations for Replit environment
    app.config["SECRET_KEY"] = os.environ.get(
        "FLASK_SECRET_KEY", "dev_key")  # Use environment variable
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SERVER_NAME"] = None  # Allow all hostnames
    app.config["APPLICATION_ROOT"] = "/"
    app.config["PREFERRED_URL_SCHEME"] = "https"  # Added for Replit HTTPS
    
    # Add Google Maps API key to app config to make it available in templates
    app.config["GOOGLE_MAPS_API_KEY"] = os.environ.get("GOOGLE_MAPS_API_KEY", "")

    # Database configuration
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
        "pool_timeout": 30,
        "connect_args": {
            "connect_timeout": 10
        }
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Enhanced session configuration
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)  # Longer session lifetime
    app.config['SESSION_COOKIE_SECURE'] = False  # Disable for local development
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_USE_SIGNER'] = False  # Disable signer to avoid bytes/string conversion issues
    app.config['SESSION_FILE_DIR'] = './flask_session'
    app.config['SESSION_FILE_THRESHOLD'] = 500
    app.config['SESSION_REFRESH_EACH_REQUEST'] = True
    app.config['SESSION_COOKIE_NAME'] = 'funlist_session'

    # Add request logging
    @app.before_request
    def log_request():
        logger.info(f"Incoming request: {request.method} {request.url}")
        logger.debug(f"Request headers: {dict(request.headers)}")

    @app.after_request
    def after_request(response):
        """Add security headers and log response details after each request."""
        # Set Content Security Policy header
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://auth.util.repl.co https://*.replit.dev https://*.repl.co https://*.googleapis.com https://*.gstatic.com https://maps.google.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://*.googleapis.com; "
            "img-src 'self' data: https: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com; "
            "font-src 'self' https://cdnjs.cloudflare.com https://*.gstatic.com; "
            "connect-src 'self' https: https://*.googleapis.com https://*.google.com; "
            "frame-src 'self' https://auth.util.repl.co https://*.replit.dev https://*.repl.co https://*.google.com"
            # Remove report-uri to prevent CSP violation reports causing CSRF issues
        )
        response.headers['Content-Security-Policy'] = csp

        # Log response details
        app.logger.info(f'Response status: {response.status}')
        return response

    try:
        logger.info("Initializing database...")
        db.init_app(app)
        with app.app_context():
            db.create_all()
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}", exc_info=True)
        raise

    try:
        logger.info("Initializing Flask-Migrate...")
        migrate = Migrate(app, db)
        logger.info("Flask-Migrate initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Flask-Migrate: {str(e)}",
                     exc_info=True)
        raise

    try:
        logger.info("Initializing CSRF protection...")
        csrf = CSRFProtect(app)

        # Exempt API routes from CSRF protection
        @csrf.exempt
        def csrf_exempt_api():
            # Exempt all routes that are API routes or CSP report endpoint
            if request.path.startswith('/admin/event/') and request.method == 'POST':
                return True
            if request.path == '/csp-report' and request.method == 'POST':
                return True
            return False
    except Exception as e:
        logger.error(f"Failed to initialize CSRF protection: {str(e)}",
                     exc_info=True)
        raise

    try:
        logger.info("Initializing Session...")
        Session(app)
    except Exception as e:
        logger.error(f"Failed to initialize Session: {str(e)}", exc_info=True)
        raise

    try:
        logger.info("Setting up login manager...")
        login_manager = LoginManager()
        login_manager.init_app(app)
        login_manager.login_view = "login"
        login_manager.login_message = "Please log in to access this page."
        login_manager.login_message_category = "info"
        login_manager.session_protection = "strong"
    except Exception as e:
        logger.error(f"Failed to initialize login manager: {str(e)}",
                     exc_info=True)
        raise

    try:
        logger.info("Importing User model...")
        from models import User
    except Exception as e:
        logger.error(f"Failed to import User model: {str(e)}", exc_info=True)
        raise

    @login_manager.user_loader
    def load_user(user_id):
        try:
            return db.session.get(User, int(user_id))
        except Exception as e:
            logger.error(f"Error loading user {user_id}: {str(e)}",
                         exc_info=True)
            return None

    try:
        logger.info("Initializing routes...")
        from routes import init_routes
        init_routes(app)
        logger.info("Routes initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize routes: {str(e)}", exc_info=True)
        raise

    logger.info("Application creation completed successfully")
    return app


# No app.run() or port handling here!