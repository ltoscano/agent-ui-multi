#!/usr/bin/env python3
"""
Authentication server for the Agent UI application.
Manages invitation codes and user authentication.
"""

import sqlite3
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Database configuration
DB_PATH = os.path.join(os.path.dirname(__file__), 'auth.db')

def init_database():
    """Initialize the SQLite database with invitations table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create invitations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invitation_code TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME NULL,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create sessions table for active sessions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_token TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES invitations (id)
        )
    ''')
    
    # Insert initial invitation codes
    initial_invitations = [
        ('JK23', 'Lorenzo'),
        ('JK46', 'Simone')
    ]
    
    for code, username in initial_invitations:
        cursor.execute('''
            INSERT OR IGNORE INTO invitations (invitation_code, username)
            VALUES (?, ?)
        ''', (code, username))
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def generate_session_token():
    """Generate a secure session token."""
    return secrets.token_urlsafe(32)

@app.route('/api/auth/verify-invitation', methods=['POST'])
def verify_invitation():
    """Verify an invitation code and create a session."""
    try:
        data = request.get_json()
        invitation_code = data.get('invitation_code', '').strip().upper()
        
        if not invitation_code:
            return jsonify({'error': 'Invitation code is required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if invitation code exists and is active
        cursor.execute('''
            SELECT id, username, is_active FROM invitations 
            WHERE invitation_code = ? AND is_active = 1
        ''', (invitation_code,))
        
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return jsonify({'error': 'Invalid invitation code'}), 401
        
        user_id = result[0]
        username = result[1]
        
        # Generate session token
        session_token = generate_session_token()
        expires_at = datetime.now() + timedelta(days=30)  # 30 days session
        
        # Store session
        cursor.execute('''
            INSERT INTO sessions (session_token, user_id, username, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (session_token, user_id, username, expires_at))
        
        # Mark invitation as used (optional - you can keep it active for multiple logins)
        cursor.execute('''
            UPDATE invitations SET used_at = CURRENT_TIMESTAMP 
            WHERE invitation_code = ?
        ''', (invitation_code,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'session_token': session_token,
            'user_id': user_id,
            'username': username,
            'expires_at': expires_at.isoformat()
        })
        
    except Exception as e:
        print(f"Error verifying invitation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/verify-session', methods=['POST'])
def verify_session():
    """Verify a session token."""
    try:
        data = request.get_json()
        session_token = data.get('session_token', '').strip()
        
        if not session_token:
            return jsonify({'error': 'Session token is required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if session exists and is not expired
        cursor.execute('''
            SELECT user_id, username, expires_at FROM sessions 
            WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP
        ''', (session_token,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        user_id = result[0]
        username = result[1]
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'username': username,
            'valid': True
        })
        
    except Exception as e:
        print(f"Error verifying session: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout and invalidate session."""
    try:
        data = request.get_json()
        session_token = data.get('session_token', '').strip()
        
        if not session_token:
            return jsonify({'error': 'Session token is required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete the session
        cursor.execute('DELETE FROM sessions WHERE session_token = ?', (session_token,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error during logout: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/invitations', methods=['GET'])
def list_invitations():
    """List all invitations (for admin purposes)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT invitation_code, username, created_at, used_at, is_active
            FROM invitations ORDER BY created_at DESC
        ''')
        
        invitations = []
        for row in cursor.fetchall():
            invitations.append({
                'invitation_code': row[0],
                'username': row[1],
                'created_at': row[2],
                'used_at': row[3],
                'is_active': bool(row[4])
            })
        
        conn.close()
        
        return jsonify({'invitations': invitations})
        
    except Exception as e:
        print(f"Error listing invitations: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'auth_server'})

if __name__ == '__main__':
    init_database()
    print("Starting authentication server on port 8001...")
    app.run(host='0.0.0.0', port=8001, debug=True)
