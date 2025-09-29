from flask import Flask,request,send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os 
import json

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'secret!'
CORS(app,resources={r"/*":{"origins":"*"}})
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='eventlet',  # Add async mode for better performance
    ping_timeout=60,        # Increase ping timeout for reliable connections
    ping_interval=25        # Adjust ping interval
    )

players = {}
character_to_socket = {}
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/test')
def test():
    return "Server is running!"

@socketio.on('connect')
def handle_connect():
    player_id = request.sid
    print(f'Player {player_id} connected')

    players[player_id] = {
        'id':player_id,
        'characterId':None,
        'position': {'x': 0, 'y': 0, 'z': 0},
        'rotation': {'y': 0},
        'animation': 'Idle',
        'model': 'default'
    }
    emit('currentPlayers', players)
    emit('newPlayer', players[player_id], broadcast=True,include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    player_id = request.sid
    print(f'Player {player_id} disconnected')

    if player_id in players:
        del players[player_id]
        emit('removePlayer', player_id, broadcast=True)

@socketio.on('playerUpdate')
def handle_player_update(data):
    player_id = request.sid
    character_id = data.get('characterId')

    if player_id in players:
        if players[player_id]['characterId'] != character_id:
            if character_id in character_to_socket and character_to_socket[character_id] != player_id:
                print(f"Character {character_id} is already owned by {character_to_socket[character_id]}")
                return
            if players[player_id]['characterId']:
                old_char_id = players[player_id]['characterId']
                if character_to_socket.get(old_char_id):
                    del character_to_socket[old_char_id]
            players[player_id]['characterId'] = character_id
            character_to_socket[character_id] = player_id
            emit('newPlayer', players[player_id], broadcast=True)

        if players[player_id]['characterId'] == character_id:
            players[player_id]['position'] = data['position']
            players[player_id]['rotation'] = data['rotation']
            players[player_id]['animation'] = data['animation']
            players[player_id]['characterId'] = character_id
            emit('playerMoved', {
                'id': player_id,
                'characterId': character_id,
                'position': data['position'],
                'rotation': data['rotation'],
                'animation': data['animation']
            }, broadcast=True, include_self=False)

if __name__ == '__main__':
    try:
        print("Starting Flask-SocketIO server on port 3000...")
        socketio.run(app, host='0.0.0.0', port=3000, debug=True, log_output=True)
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()


