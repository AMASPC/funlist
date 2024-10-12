from flask import render_template, flash, redirect, url_for, request
from flask_login import current_user, login_user, logout_user, login_required
from app import app, db
from models import User, Event, OrganizerProfile, UserGroup
from forms import LoginForm, RegistrationForm, EventForm, OrganizerProfileForm, PasswordResetRequestForm, PasswordResetForm
from utils import get_weekly_top_events, get_personalized_recommendations, get_events_by_user_groups
import secrets

@app.route('/')
def index():
    top_events = get_weekly_top_events(limit=10)
    return render_template('index.html', top_events=top_events)

@app.route('/events')
def events():
    events = Event.query.all()
    return render_template('events.html', events=events)

@app.route('/event/<int:event_id>')
def event_detail(event_id):
    event = Event.query.get_or_404(event_id)
    return render_template('event_detail.html', event=event)

@app.route('/submit_event', methods=['GET', 'POST'])
@login_required
def submit_event():
    form = EventForm()
    if form.validate_on_submit():
        event = Event(
            title=form.title.data,
            description=form.description.data,
            date=form.date.data,
            location=form.location.data,
            latitude=form.latitude.data,
            longitude=form.longitude.data,
            category=form.category.data,
            target_audience=form.target_audience.data,
            fun_meter=form.fun_meter.data,
            user_id=current_user.id
        )
        db.session.add(event)
        db.session.commit()
        flash('Your event has been submitted!', 'success')
        return redirect(url_for('events'))
    return render_template('submit_event.html', form=form)

@app.route('/organizer_profile', methods=['GET', 'POST'])
@login_required
def organizer_profile():
    if not current_user.is_organizer:
        flash('You must be registered as an organizer to access this page.', 'error')
        return redirect(url_for('index'))
    
    profile = OrganizerProfile.query.filter_by(user_id=current_user.id).first()
    if profile is None:
        profile = OrganizerProfile(user_id=current_user.id)
        db.session.add(profile)
        db.session.commit()
    
    form = OrganizerProfileForm(obj=profile)
    if form.validate_on_submit():
        form.populate_obj(profile)
        db.session.commit()
        flash('Your organizer profile has been updated!', 'success')
        return redirect(url_for('organizer_profile'))
    return render_template('organizer_profile.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid email or password', 'error')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'):
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            is_organizer=form.is_organizer.data,
            opt_in_email=form.opt_in_email.data
        )
        user.set_password(form.password.data)
        for group_name in form.user_groups.data:
            group = UserGroup.query.filter_by(name=group_name).first()
            if group is None:
                group = UserGroup(name=group_name)
                db.session.add(group)
            user.groups.append(group)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now registered!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.route('/weekly_top_10')
def weekly_top_10():
    top_events = get_weekly_top_events(limit=10)
    return render_template('weekly_top_10.html', top_events=top_events)

@app.route('/map')
def map_view():
    events = Event.query.all()
    return render_template('map.html', events=events)

@app.route('/recommendations')
@login_required
def recommendations():
    recommended_events = get_personalized_recommendations(current_user)
    return render_template('recommendations.html', events=recommended_events)

@app.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = PasswordResetRequestForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            reset_token = secrets.token_urlsafe(32)
            user.reset_token = reset_token
            db.session.commit()
            # Send email with reset instructions (implement this part)
            flash('Check your email for instructions to reset your password', 'info')
        else:
            flash('No account found with that email address', 'error')
        return redirect(url_for('login'))
    return render_template('reset_password_request.html', form=form)

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return redirect(url_for('index'))
    form = PasswordResetForm()
    if form.validate_on_submit():
        user.set_password(form.password.data)
        user.reset_token = None
        db.session.commit()
        flash('Your password has been reset', 'success')
        return redirect(url_for('login'))
    return render_template('reset_password.html', form=form)
