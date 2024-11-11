from flask import render_template, flash, redirect, url_for
from werkzeug.security import generate_password_hash
from flask_login import current_user, login_required
from forms import SignupForm
from models import User
from db_init import db
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging
from typing import List
# Temporarily comment out email verification import
# from email_utils import send_verification_email
from urllib.parse import unquote

logger = logging.getLogger(__name__)

def init_routes(app):
    @app.route('/')
    def index():
        return redirect(url_for('signup'))

    @app.route('/signup', methods=['GET', 'POST'])
    def signup():
        if current_user.is_authenticated:
            flash('You are already signed up and logged in.', 'info')
            return redirect(url_for('index'))
            
        form = SignupForm()
        if form.validate_on_submit():
            try:
                # Create new user instance
                user = User()
                user.email = form.email.data
                user.password_hash = generate_password_hash(form.password.data)
                # Set account active by default (temporary)
                user.account_active = True
                user.email_verified = True  # Temporarily set to True
                
                # Add user to database
                db.session.add(user)
                db.session.commit()
                
                # Email verification temporarily disabled
                # try:
                #     send_verification_email(user)
                #     logger.info(f"Verification email sent to user: {user.email}")
                #     flash('Please check your email to verify your account before logging in.', 'info')
                # except Exception as e:
                #     logger.error(f"Error sending verification email: {str(e)}")
                #     flash('Account created but there was a problem sending the verification email. Please contact support.', 'warning')
                
                flash('Account created successfully! You can now log in.', 'success')
                return redirect(url_for('login'))
                
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Database integrity error during sign up: {str(e)}")
                error_msg = str(e).lower()
                
                if 'email' in error_msg and 'unique constraint' in error_msg:
                    flash('This email address is already registered. Please use a different email or try logging in.', 'danger')
                    form.email.errors = list(form.email.errors) + ['Email already registered']
                else:
                    flash('There was a problem with your sign up. Please verify your information and try again.', 'danger')
                    
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Database error during sign up: {str(e)}")
                flash('We encountered a technical issue. Our team has been notified. Please try again later.', 'danger')
                
            except Exception as e:
                db.session.rollback()
                logger.error(f"Unexpected error during sign up: {str(e)}")
                flash('An unexpected error occurred. Please try again. If the problem persists, contact support.', 'danger')
        
        return render_template('signup.html', form=form)

    # Temporarily comment out email verification route
    # @app.route('/verify/<token>')
    # def verify_email(token):
    #     try:
    #         # Decode the URL-encoded token
    #         decoded_token = unquote(token)
    #         email = User.verify_token(decoded_token, app.config['SECRET_KEY'])
            
    #         if email is None:
    #             flash('The verification link is invalid or has expired. Please request a new verification email.', 'danger')
    #             return redirect(url_for('login'))
            
    #         user = User.query.filter_by(email=email).first()
    #         if user is None:
    #             logger.error(f"No user found for email: {email}")
    #             flash('Invalid verification link.', 'danger')
    #             return redirect(url_for('login'))
            
    #         if user.email_verified:
    #             flash('Email already verified. Please login.', 'info')
    #             return redirect(url_for('login'))
            
    #         user.email_verified = True
    #         user.account_active = True
    #         db.session.commit()
            
    #         logger.info(f"Email verified successfully for user: {email}")
    #         flash('Your email has been verified! You can now log in.', 'success')
    #         return redirect(url_for('login'))
            
    #     except Exception as e:
    #         logger.error(f"Error during email verification: {str(e)}")
    #         flash('An error occurred during verification. Please try again or contact support.', 'danger')
    #         return redirect(url_for('login'))

    @app.route('/login', methods=['GET'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
        return render_template('login.html')

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template('500.html'), 500
