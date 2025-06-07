# Authentication Setup Guide

This application now includes an authentication system using invitation codes. Follow these steps to set up and run the application.

## Prerequisites

- Node.js and pnpm installed
- Python 3.7+ installed

## Setup Instructions

### 1. Start the Authentication Server (Python)

The authentication server manages invitation codes and user sessions.

**Option A: Using the provided script (Recommended)**
```bash
cd server
./start_auth_server.sh
```

**Option B: Manual setup**
```bash
cd server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python auth_server.py
```

The authentication server will start on `http://localhost:8001`

### 2. Start the Next.js Application

In a separate terminal window:

```bash
# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Authentication Flow

1. When you visit `http://localhost:3000`, you'll see a login modal
2. Enter one of the valid invitation codes:
   - **JK23** (Lorenzo)
   - **JK46** (Simone)
3. After successful authentication, you'll be redirected to the main application
4. Your session will be stored for 30 days
5. Use the logout button in the sidebar to end your session

## API Endpoints

The authentication server provides the following endpoints:

- `POST /api/auth/verify-invitation` - Verify invitation code and create session
- `POST /api/auth/verify-session` - Verify current session
- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/invitations` - List all invitations (admin)
- `GET /health` - Health check

## Database

The authentication system uses SQLite database (`server/auth.db`) with:
- `invitations` table: stores invitation codes and user info
- `sessions` table: stores active user sessions

## Security Features

- Session tokens are cryptographically secure
- Sessions expire after 30 days
- CORS protection enabled
- Input validation and sanitization
- SQL injection protection using parameterized queries

## Troubleshooting

**Login modal doesn't appear:**
- Check that the authentication server is running on port 8001
- Check browser console for errors

**Invalid invitation code error:**
- Ensure you're using the correct codes: JK23 or JK46
- Codes are case-insensitive but will be converted to uppercase

**Session expired:**
- Sessions last 30 days. After expiration, you'll need to log in again
- Clear browser cookies if you experience issues

## Adding New Invitation Codes

To add new invitation codes, you can:

1. Connect to the SQLite database directly:
```bash
sqlite3 server/auth.db
INSERT INTO invitations (invitation_code, username) VALUES ('NEW_CODE', 'Username');
```

2. Or modify the `auth_server.py` file to add more initial codes in the `init_database()` function.
