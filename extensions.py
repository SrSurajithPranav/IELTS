from flask_socketio import SocketIO

# SocketIO extension instance — initialized in create_app via init_app
socketio = SocketIO(async_mode='threading')
