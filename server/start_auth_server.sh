#!/bin/bash

# Script to start the authentication server

echo "Starting authentication server..."

# Change to server directory
cd "$(dirname "$0")"

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Start the server
echo "Starting server on port 8001..."
python auth_server.py
