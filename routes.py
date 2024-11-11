from flask import render_template, flash, redirect, url_for, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import current_user, login_required, login_user, logout_user
from forms import SignupForm, LoginForm, ProfileForm
from models import User
from db_init import db
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

def init_routes(app):
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return render_template('index.html')
        return redirect(url_for('login'))

    @app.route('/signup', methods=['GET', 'POST'])
    def signup():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
            
        form = SignupForm()
        if form.validate_on_submit():
            try:
                # Create new user instance
                user = User()
                user.email = form.email.data
                user.set_password(form.password.data)
                user.account_active = True
                
                # Add user to database
                db.session.add(user)
                db.session.commit()
                
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

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('index'))

        form = LoginForm()
        if form.validate_on_submit():
            try:
                user = User.query.filter_by(email=form.email.data).first()
                
                if user and user.check_password(form.password.data):
                    login_user(user, remember=form.remember_me.data)
                    user.last_login = db.func.now()
                    db.session.commit()
                    
                    flash('Logged in successfully!', 'success')
                    next_page = request.args.get('next')
                    return redirect(next_page or url_for('index'))
                else:
                    logger.warning(f"Failed login attempt for email: {form.email.data}")
                    flash('Invalid email or password. Please try again.', 'danger')
                    
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Database error during login: {str(e)}")
                flash('We encountered a technical issue. Please try again later.', 'danger')
                
            except Exception as e:
                logger.error(f"Unexpected error during login: {str(e)}")
                flash('An unexpected error occurred. Please try again.', 'danger')
                
        return render_template('login.html', form=form)

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('You have been logged out successfully.', 'info')
        return redirect(url_for('login'))

    @app.route('/profile', methods=['GET'])
    @login_required
    def profile():
        return render_template('profile.html', user=current_user)

    @app.route('/profile/edit', methods=['GET', 'POST'])
    @login_required
    def edit_profile():
        form = ProfileForm()
        form.user_id = current_user.id

        if request.method == 'GET':
            # Pre-populate form with current user data
            form.username.data = current_user.username
            form.first_name.data = current_user.first_name
            form.last_name.data = current_user.last_name
            form.bio.data = current_user.bio
            form.location.data = current_user.location
            form.interests.data = current_user.interests
            form.birth_date.data = current_user.birth_date

        if form.validate_on_submit():
            try:
                profile_data = {
                    'username': form.username.data,
                    'first_name': form.first_name.data,
                    'last_name': form.last_name.data,
                    'bio': form.bio.data,
                    'location': form.location.data,
                    'interests': form.interests.data,
                    'birth_date': form.birth_date.data
                }
                
                current_user.update_profile(profile_data)
                db.session.commit()
                flash('Profile updated successfully!', 'success')
                return redirect(url_for('profile'))
                
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Database integrity error during profile update: {str(e)}")
                flash('There was a problem updating your profile. Please try again.', 'danger')
                
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Database error during profile update: {str(e)}")
                flash('We encountered a technical issue. Please try again later.', 'danger')
                
            except Exception as e:
                db.session.rollback()
                logger.error(f"Unexpected error during profile update: {str(e)}")
                flash('An unexpected error occurred. Please try again.', 'danger')

        return render_template('edit_profile.html', form=form)

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template('500.html'), 500
