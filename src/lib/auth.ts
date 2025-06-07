/**
 * Authentication utilities for managing user sessions
 */

import Cookies from 'js-cookie'

const AUTH_COOKIE_NAME = 'auth_session'
const AUTH_USER_COOKIE_NAME = 'auth_user'
const AUTH_USER_ID_COOKIE_NAME = 'auth_user_id'
const AUTH_SERVER_URL = 'http://localhost:8001'

export interface AuthResponse {
  success: boolean
  session_token?: string
  user_id?: number
  username?: string
  expires_at?: string
  error?: string
}

export interface SessionValidation {
  success: boolean
  user_id?: number
  username?: string
  valid?: boolean
  error?: string
}

/**
 * Verify an invitation code and create a session
 */
export async function verifyInvitationCode(invitationCode: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/verify-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitation_code: invitationCode.trim().toUpperCase()
      }),
    })

    const data = await response.json()
    
    if (data.success && data.session_token) {
      // Store session in cookies
      Cookies.set(AUTH_COOKIE_NAME, data.session_token, { 
        expires: 30, // 30 days
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
      })
      Cookies.set(AUTH_USER_COOKIE_NAME, data.username, { 
        expires: 30,
        secure: false,
        sameSite: 'lax'
      })
      if (data.user_id) {
        Cookies.set(AUTH_USER_ID_COOKIE_NAME, data.user_id.toString(), { 
          expires: 30,
          secure: false,
          sameSite: 'lax'
        })
      }
    }

    return data
  } catch (error) {
    console.error('Error verifying invitation code:', error)
    return {
      success: false,
      error: 'Failed to verify invitation code. Please try again.'
    }
  }
}

/**
 * Verify the current session
 */
export async function verifySession(): Promise<SessionValidation> {
  const sessionToken = Cookies.get(AUTH_COOKIE_NAME)
  
  if (!sessionToken) {
    return {
      success: false,
      valid: false,
      error: 'No session found'
    }
  }

  try {
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_token: sessionToken
      }),
    })

    const data = await response.json()
    
    if (data.success && data.user_id) {
      // Update user_id cookie if needed
      Cookies.set(AUTH_USER_ID_COOKIE_NAME, data.user_id.toString(), { 
        expires: 30,
        secure: false,
        sameSite: 'lax'
      })
    } else if (!data.success) {
      // Clear invalid session
      clearSession()
    }

    return data
  } catch (error) {
    console.error('Error verifying session:', error)
    clearSession()
    return {
      success: false,
      valid: false,
      error: 'Failed to verify session'
    }
  }
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  const sessionToken = Cookies.get(AUTH_COOKIE_NAME)
  
  if (sessionToken) {
    try {
      await fetch(`${AUTH_SERVER_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_token: sessionToken
        }),
      })
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }
  
  clearSession()
}

/**
 * Clear session data from cookies
 */
export function clearSession(): void {
  Cookies.remove(AUTH_COOKIE_NAME)
  Cookies.remove(AUTH_USER_COOKIE_NAME)
  Cookies.remove(AUTH_USER_ID_COOKIE_NAME)
}

/**
 * Get current user info from cookies
 */
export function getCurrentUser(): { 
  username: string | null, 
  sessionToken: string | null, 
  userId: string | null 
} {
  const username = Cookies.get(AUTH_USER_COOKIE_NAME) || null
  const userId = Cookies.get(AUTH_USER_ID_COOKIE_NAME) || null
  return {
    username,
    sessionToken: Cookies.get(AUTH_COOKIE_NAME) || null,
    userId
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const sessionToken = Cookies.get(AUTH_COOKIE_NAME)
  return !!sessionToken
}
