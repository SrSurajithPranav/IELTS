#!/usr/bin/env python3
"""
Dev runner for Socket.IO allowing unsafe Werkzeug in development for testing.

Usage:
  ALLOW_UNSAFE_WERKZEUG=true python run_socketio.py

Warning: Do NOT use `allow_unsafe_werkzeug=True` in production. Use a production-ready async server (eventlet/gevent/uvicorn) instead.
"""
import os
from app import create_app
from extensions import socketio

env = os.getenv("FLASK_ENV", "development")
allow_unsafe = os.getenv("ALLOW_UNSAFE_WERKZEUG", "true").lower() in ("1", "true", "yes")
port = int(os.getenv("PORT", "5000"))
debug = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")

app = create_app(env)
print(f"Starting socketio server (env={env}, port={port}, allow_unsafe={allow_unsafe})")
socketio.run(app, host="0.0.0.0", port=port, debug=debug, allow_unsafe_werkzeug=allow_unsafe)
