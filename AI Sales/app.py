from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from flask_mysqldb import MySQL
import MySQLdb.cursors
import re
from passlib.hash import sha256_crypt
import openai
import pandas as pd
from pandasql import sqldf
from Backend import chat_main
import json
import random
from flask_socketio import SocketIO
from pymongo import MongoClient
from bson.objectid import ObjectId
import threading
from datetime import datetime   
# from models import DatabaseManager

# manager = DatabaseManager()
app = Flask(__name__)
app.static_folder = 'static'
async_mode=None
socketio = SocketIO(app, cors_allowed_origins="*")  
# Change this to your secret key (can be anything, it's for extra protection)
app.secret_key = 'workspace'


# Enter your database connection details below
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'workspace'

app.config['MONGO_URI'] = 'mongodb://localhost:27017/mydatabase'
mongo = MongoClient(app.config['MONGO_URI'])
db = mongo.get_database()
# data = manager.query_all()
print('data', db)


# Intialize MySQL
mysql = MySQL(app)


def chatbot_response(question):
    prompt = '''
    ### Postgres SQL tables, with their properties:
    #
    # df(indicator,period,source,location,value,value_type,Sub-dashboard)
    #
    '''

    prompt += '### '+question+'\nSelect'

    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=prompt,
        temperature=0,
        max_tokens=150,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
        stop=['#', ';']
    )

    if len(response['choices'])<1:
        print("Sorry, I am facing some problem. Maybe internet is down or maybe the openAI is not responding.")

    if response['choices'][0]['text'] == '':
        return "Sorry, I couldn't find a response."
    sql='Select '+response['choices'][0]['text'].strip()
    print(f'the sql query obtained is: {sql}....')
    return sql


@app.route('/')
def my():
    return redirect(url_for('login'))

@app.route('/create-collection')
def create_collection():
    new_collection_name = 'mynewcollection'
    db.create_collection(new_collection_name)
    return 'New collection created: {}'.format(new_collection_name)

@app.route('/Insert-Data')
def insertData():
    data = {"from": 'John',"to": "Nick", "message": "Hello, I am just inserted to you", "time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  "view": "off"}
    new_collection_name = 'mynewcollection'
    socketio.emit('updateMsg', data)
    db[new_collection_name].insert_one(data)

    return {'message':'add success'}


@app.route('/delete-record/<record_id>', methods=['get'])
def delete_record(record_id):
    collection = db['mynewcollection']
    result = collection.delete_one({'_id': ObjectId(record_id)})
    if result.deleted_count > 0:
        return 'Record deleted successfully'
    else:
        return 'Record not found'

@socketio.on('connect')
def handle_connect():
    user_id = request.args.get('userId')
    print('Client connected', user_id)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('message_from_client')
def handle_message_from_client(message):
    print('Received message from client:', message)
    # Process the message or perform any necessary actions
    # You can also emit events back to the client if required
    socketio.emit('message_from_server', 'This is a message from the server')

@socketio.on('chatData')
def handle_chat_data():
    new_collection_name = "mynewcollection"
    records = []
    for record in db[new_collection_name].find():
        records.append({"from":record["from"], "to":record["to"],
                         "message": record["message"], "time": record["time"], "view": record["view"]})
    print('all', (records))
    # Process the message or perform any necessary actions
    # You can also emit events back to the client if required
    socketio.emit('wholeMsg', records)

@socketio.on('saveNewRecord')
def save_new_record(record):
    print('record', record)
    new_collection_name = 'mynewcollection'
    db[new_collection_name].insert_one(record)

    return {'message':'add success'}

@socketio.on('readinfo')
def save_new_record(userId):
    print('userId', userId)
    new_collection_name = "mynewcollection"
    for record in db[new_collection_name].find():
        if record['from'] == userId:
            db[new_collection_name].update_one({'_id': record['_id']}, {'$set': {'view': 'on'}})
    return {'message':'view field is changed!'}


@app.route("/load_data", methods = ['GET', 'POST'])
def load_csv():
    if request.method == 'POST':
        csvfile=request.files['csvLoad']
        global df
        df = pd.read_csv(csvfile)
        print('file is loaded')
    return render_template("chat.html")

@app.route("/get")
def get_bot_response():
    userText = request.args.get('msg')
    questionType = request.args.get('questionType')

    res = chat_main.get_response(userText, questionType)
    print("get_res: ",res)
    return res

@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response
    

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Output message
    msg=''
    
    # Check if "username" and "password" POST requests exist
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        # Create variables for easy access
        username = request.form['username']
        password = request.form['password']
        
        # Check if account exists using MySQL
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("SELECT * FROM users WHERE username = %s",[username])
        # Fetch account exists using MySQL
        account = cursor.fetchone()
        if account:
            passw = account['password']    
            #To compare Passwords            
            if sha256_crypt.verify("password", passw):      
                # Create session data, we can access this data in other routes
                session['loggedin'] = True
                session['id'] = account['id']
                session['username'] = account['username']
                session['permission'] = account['permission']
                # Redirect to home page
                return redirect(url_for('chat'))
            else:
                #Account exists password incorrect
                msg = 'Incorrect password!'
        else:
            #Account not exists 
            msg = 'No username found!'
    # Show the login form with message (if any)
    return render_template('index.html', msg=msg)
    
@app.route('/logout', methods = ['POST'])
def logout():
    # Remove session data, this will log the user out
   session.pop('loggedin', None)
   session.pop('id', None)
   session.pop('username', None)
   session.pop('permission', 0)
   # Redirect to login page
   return redirect(url_for('login'))


@app.route('/createaccount', methods=['GET', 'POST'])
def createaccount():
    # Output message if something goes wrong...
    msg = ''
    # Check if "username", "password" and "email" POST requests exist (user submitted form)
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form and 'email' in request.form:
        # Create variables for easy access
        username = request.form['username']
        password = request.form['password']
        password = sha256_crypt.encrypt("password")
        email = request.form['email']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        account = cursor.fetchone()
        # If account exists show error and validation checks
        if account:
            msg = 'Account already exists!'
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            msg = 'Invalid email address!'
        elif not re.match(r'[A-Za-z0-9]+', username):
            msg = 'Username must contain only characters and numbers!'
        elif not username or not password or not email:
            msg = 'Please fill out the form!'
        else:
            if username == 'admin':
                permission = 1
            else:
                permission = 0
            # Account doesnt exists and the form data is valid, now insert new account into accounts table
            cursor.execute('INSERT INTO users VALUES (NULL, %s, %s, %s, %s)', (username, password, email, permission))
            mysql.connection.commit()
            msg = 'You have successfully registered!'
    elif request.method == 'POST':
        # Form is empty... (no POST data)
        msg = 'Please fill out the form!'
    # Show registration form with message (if any)
    return render_template('createaccount.html', msg=msg)


@app.route('/chat')
def chat():
    # Check if user is loggedin
    # if 'loggedin' in session:
        # User is loggedin show them the home page
        return render_template('chat.html', username='john')
    # User is not loggedin redirect to login page
    # return redirect(url_for('login'))

@app.route('/question')
def question():
    random_number = random.randint(0, 9)
    with open('questions.json', 'r') as f:
        # Load the JSON data from the file
        data = json.load(f)

    # Print the data to the console
    temp = data["Greeting & Name"]
    print(temp["question"][random_number])
    temp = {"type":temp["type"], "data": temp["question"][random_number]}
    return temp

def run_flask():
    app.run(port=5000)

def run_socketio():
    socketio.run(app, port=8000)

if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask)
    socketio_thread = threading.Thread(target=run_socketio)

    flask_thread.start()
    socketio_thread.start()

    flask_thread.join()
    socketio_thread.join()