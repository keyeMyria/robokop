#!/usr/bin/env python

"""Flask web server thread"""

# spin up Celery workers:
# one worker with 4 processes for the answer queue
# one worker with 1 process for the update queue
#   celery -A tasks.celery worker --loglevel=info -c 4 -n answerer@robokop -Q answer
#   celery -A tasks.celery worker --loglevel=info -c 1 -n updater@robokop -Q update
# here is a shortcut:
#   celery multi start answerer@robokop updater@robokop -A tasks.celery -l info -c:1 4 -c:2 1 -Q:1 answer -Q:2 update
# to stop them:
#   celery multi stop answerer updater
# `celery multi restart ...` seems to begin 4 processes for the updater. Avoid this.

# spin up Redis message passing:
# redis-server

# also start up Postgres and Neo4j...

import os
import json
import logging
import time
import string
import random
from datetime import datetime

from flask import Flask, jsonify, request, render_template, url_for, redirect
from flask_security import Security, SQLAlchemySessionUserDatastore, auth_required
from flask_security.core import current_user
from flask_login import LoginManager, login_required

from setup import app, db
from logging_config import logger
from user import User, Role, list_users
from question import Question, list_questions, get_question_by_id, list_questions_by_username, list_questions_by_hash
from answer import get_answerset_by_id, list_answersets_by_question_hash, get_answer_by_id, list_answers_by_answerset, list_answersets
from feedback import Feedback, list_feedback_by_answer

from tasks import celery, answer_question, update_kg

# Setup flask-security with user tables
user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
security = Security(app, user_datastore)

# Create a user to test with
@app.before_first_request
def init():
    pass

# Flask Server code below
################################################################################

class InvalidUsage(Exception):
    """Error handler class to translate python exceptions to json messages"""
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    """Error handler to translate python exceptions to json messages"""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def getAuthData():
    """ Return relevant information from flask-login current_user"""
    # is_authenticated
    #   This property should return True if the user is authenticated, i.e. they have provided valid credentials. (Only authenticated users will fulfill the criteria of login_required.)
    # is_active
    #   This property should return True if this is an active user - in addition to being authenticated, they also have activated their account, not been suspended, or any condition your application has for rejecting an account. Inactive accounts may not log in (without being forced of course).
    # is_anonymous
    #   This property should return True if this is an anonymous user. (Actual users should return False instead.)

    is_authenticated = current_user.is_authenticated
    is_active = current_user.is_active
    is_anonymous = current_user.is_anonymous
    if is_anonymous:
        username = "Anonymous"
        is_admin = False
    else:
        username = current_user.username
        is_admin = current_user.has_role('admin')

    return {'is_authenticated': is_authenticated,\
            'is_active': is_active,\
            'is_anonymous': is_anonymous,\
            'is_admin': is_admin,\
            'username': username}
            
@app.route('/status/<task_id>')
def taskstatus(task_id):
    task = celery.AsyncResult(task_id)
    return task.state

# from celery.app.control import Inspect
@app.route('/tasks')
def get_tasks():
    """Fetch queued/active task list"""
    i = celery.control.inspect()
    scheduled = i.scheduled()
    reserved = i.reserved()
    active = i.active()
    answerer_queued = [(t['id'], t['args']) for t in scheduled['answerer@robokop'] + reserved['answerer@robokop']]
    answerer_active = [(t['id'], t['args']) for t in active['answerer@robokop']]
    updater_queued = [(t['id'], t['args']) for t in scheduled['updater@robokop'] + reserved['updater@robokop']]
    updater_active = [(t['id'], t['args']) for t in active['updater@robokop']]
    response = {'answerers_queued': answerer_queued,\
        'answerers_active': answerer_active,\
        'updaters_queued': updater_queued,\
        'updaters_active': updater_active}
    return str(response)

@app.route('/')
def landing():
    """Initial contact. Give the initial page."""
    return render_template('landing.html')

@app.route('/landing/data', methods=['GET'])
def landing_data():
    """Data for the landing page."""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user})

# Account information
@app.route('/account')
@login_required
def account():
    """Deliver user info page"""
    return render_template('account.html')

@app.route('/account/data', methods=['GET'])
@auth_required('session', 'basic')
def account_data():
    """Data for the current user"""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user})

# New Question Interface
@app.route('/q/new', methods=['GET'])
def new():
    """Deliver new-question interface"""
    return render_template('questionNew.html')

# New Question Submission
@app.route('/q/new', methods=['POST'])
@auth_required('session', 'basic')
def new_submission():
    """Create new question"""
    user_id = current_user.id
    name = request.json['name']
    natural_question = request.json['natural']
    notes = request.json['notes']
    nodes, edges = Question.dictionary_to_graph(request.json['query'])
    qid = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=12))
    q = Question(id=qid, user_id=user_id, name=name, natural_question=natural_question, notes=notes, nodes=nodes, edges=edges)
    return qid, 201

@app.route('/q/new/data', methods=['GET'])
def new_data():
    """Data for the new-question interface"""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user})

# QuestionList
@app.route('/questions')
def questions():
    """Initial contact. Give the initial page."""
    return render_template('questions.html')

@app.route('/questions/data', methods=['GET'])
def questions_data():
    """Data for the list of questions """

    user = getAuthData()
    question_list = list_questions()
    user_question_list = list_questions_by_username(user['username'])
    # nonuser_question_list = list_questions_by_username(user['username'], invert=True)

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'questions': [q.toJSON() for q in question_list],\
        'user_questions': [q.toJSON() for q in user_question_list]})

# Question
@app.route('/q/<question_id>', methods=['GET'])
def question(question_id):
    """Deliver user info page"""
    return render_template('question.html', question_id=question_id)

@app.route('/q/<question_id>', methods=['POST'])
@auth_required('session', 'basic')
def question_action(question_id):
    """ run update or answer actions """
    command = request.json['command']
    if 'answer' in command:
        # Answer a question
        task = answer_question.apply_async(args=[question_id])
        return jsonify({'task_id':task.id}), 202
    elif 'update' in command:
        # Update the knowledge graph for a question
        task = update_kg.apply_async(args=[question_id])
        return jsonify({'task_id':task.id}), 202

@app.route('/q/<question_id>/data', methods=['GET'])
def question_data(question_id):
    """Data for a question"""

    user = getAuthData()

    question = get_question_by_id(question_id)
    answerset_list = list_answersets_by_question_hash(question.hash)

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,
                    'user': user,
                    'question': question.toJSON(),
                    'owner': question.user.email,
                    'answerset_list': [a.toJSON() for a in answerset_list]})

@app.route('/q/<question_id>/subgraph', methods=['GET'])
def question_subgraph(question_id):
    """Data for a question"""

    question = get_question_by_id(question_id)
    subgraph = question.relevant_subgraph()

    return jsonify(subgraph)

# Answer Set
@app.route('/a/<answerset_id>')
def answerset(answerset_id):
    """Deliver answerset page for a given id"""
    return render_template('answerset.html', answerset_id=answerset_id)

@app.route('/a/<answerset_id>/data', methods=['GET'])
def answerset_data(answerset_id):
    """Data for an answerset """

    user = getAuthData()
    answerset = get_answerset_by_id(answerset_id)
    answers = list_answers_by_answerset(answerset)
    questions = list_questions_by_hash(answerset.question_hash)
    answerset_graph = None

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'answerset': answerset.toJSON(),\
        'answers': [a.toJSON() for a in answers],\
        'questions': [q.toJSON() for q in questions],\
        'answerset_graph': answerset_graph})

# Answer
@app.route('/a/<answerset_id>/<answer_id>')
def answer(answerset_id, answer_id):
    """Deliver answerset page for a given id"""
    return render_template('answer.html', answerset_id=answerset_id, answer_id=answer_id)

@app.route('/a/<answerset_id>/<answer_id>/data', methods=['GET'])
def answer_data(answerset_id, answer_id):
    """Data for an answer """
    
    user = getAuthData()
    answer = get_answer_by_id(answer_id)
    feedback = list_feedback_by_answer(answer)
    
    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'answer': answer.toJSON(),\
        'feedback': feedback})

# Admin
@app.route('/admin')
def admin():
    """Deliver admin page"""
    user = getAuthData()

    if user['is_admin']:
        return render_template('admin.html')
    else:
        return redirect(url_for('security.login', next=request.url))

@app.route('/admin/data', methods=['GET'])
def admin_data():
    """Data for admin display """
    
    user = getAuthData()
    
    if not user['is_admin']:
        return redirect(url_for('security.login', next='/admin'))
    else:
        now_str = datetime.now().__str__()
        users = [u.toJSON() for u in list_users()]
        questions = [q.toJSON() for q in list_questions()]
        answersets = [aset.toJSON() for aset in list_answersets()]

        return jsonify({'timestamp': now_str,\
            'users': users,\
            'questions': questions,\
            'answersets': answersets})

################################################################################
##### Account Editing ##########################################################
################################################################################
@app.route('/account/edit', methods=['POST'])
@login_required
def accountEdit():
    """Edit account information (if request is for current_user)"""

################################################################################
##### New Question #############################################################
################################################################################
@app.route('/q/new/search', methods=['POST'])
def question_new_search():
    """Validate/provide suggestions for a search term"""

@app.route('/q/new/validate', methods=['POST'])
def question_new_validate():
    """Validate a machine question to ensure it could possibly be executed"""

@app.route('/q/new/translate', methods=['POST'])
def question_new_translate():
    """Translate a natural language question into a machine question"""

################################################################################
##### Question Editing, Forking ################################################
################################################################################
@app.route('/q/edit', methods=['POST'])
@auth_required('session', 'basic')
def question_edit():
    """Edit the properties of a question"""
    logger.info('Editing question %s', request.json['question_id'])
    q = get_question_by_id(request.json['question_id'])
    if not (current_user == q.user or current_user.has_role('admin')):
        return "UNAUTHORIZED", 401 # not authorized
    q.name = request.json['name']
    q.notes = request.json['notes']
    q.natural_question = request.json['natural_question']
    db.session.commit()
    return "SUCCESS", 200

@app.route('/q/fork', methods=['POST'])
@auth_required('session', 'basic')
def question_fork():
    """Fork a question to form a new question owned by current_user """

@app.route('/q/delete', methods=['POST'])
@auth_required('session', 'basic')
def question_delete():
    """Delete question (if owned by current_user)"""
    logger.info('Deleting question %s', request.json['question_id'])
    q = get_question_by_id(request.json['question_id'])
    if not (current_user == q.user or current_user.has_role('admin')):
        return "UNAUTHORIZED", 401 # not authorized
    db.session.delete(q)
    db.session.commit()
    return "SUCCESS", 200

################################################################################
##### Answer Feedback ##########################################################
################################################################################
@app.route('/a/feedback', methods=['POST'])
def answer_feedback():
    """Set feedback for a specific user to a specific answer"""

################################################################################
##### Admin Interface ##########################################################
################################################################################
@app.route('/admin/q/delete', methods=['POST'])
def admin_question_delete():
    """Delete question (if current_user is admin)"""

@app.route('/admin/q/edit', methods=['POST'])
def admin_question_edit():
    """Edit question (if current_user is admin)"""

@app.route('/admin/u/delete', methods=['POST'])
def admin_user_delete():
    """Delete user (if current_user is admin)"""

@app.route('/admin/u/edit', methods=['POST'])
def admin_user_edit():
    """Delete Edit (if current_user is admin)"""

@app.route('/admin/a/delete', methods=['POST'])
def admin_answerset_delete():
    """Delete Answerset (if current_user is admin)"""


################################################################################
##### Run Webserver ############################################################
################################################################################

if __name__ == '__main__':
    # Our local config is in the main directory
    
    # We will use this host and port if we are running from python and not gunicorn
    global local_config
    config_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..')
    json_file = os.path.join(config_dir,'config.json')
    with open(json_file, 'rt') as json_in:
        local_config = json.load(json_in)
        
    app.run(host=local_config['serverHost'],\
        port=local_config['port'],\
        debug=False,\
        use_reloader=False)