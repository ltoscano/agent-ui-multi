'use client'

import { type FC, type ReactNode, useEffect, useState } from 'react'
import { LoginModal } from '@/components/auth'
import { verifyInvitationCode, verifySession, getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'

interface AuthWrapperProps {
  children: ReactNode
}

const AuthWrapper: FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string>()

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { username, sessionToken } = getCurrentUser()
      
      if (!username || !sessionToken) {
        setIsAuthenticated(false)
        setShowLoginModal(true)
        setIsLoading(false)
        return
      }

      // Verify session with the server
      const validation = await verifySession()
      
      if (validation.success && validation.valid) {
        setIsAuthenticated(true)
        setShowLoginModal(false)
        toast.success(`Welcome back, ${validation.username}!`)
      } else {
        setIsAuthenticated(false)
        setShowLoginModal(true)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsAuthenticated(false)
      setShowLoginModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (invitationCode: string) => {
    setLoginLoading(true)
    setLoginError(undefined)

    try {
      const response = await verifyInvitationCode(invitationCode)
      
      if (response.success && response.username) {
        setIsAuthenticated(true)
        setShowLoginModal(false)
        toast.success(`Welcome, ${response.username}!`)
        
        // Dispatch a custom event to notify other components of successful login
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { type: 'login', userId: response.user_id } 
        }))
      } else {
        setLoginError(response.error || 'Invalid invitation code')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Failed to verify invitation code. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Agent UI</h1>
            <p className="text-sm text-muted-foreground mt-2">Authentication required</p>
          </div>
        </div>
        <LoginModal
          isOpen={showLoginModal}
          onLogin={handleLogin}
          isLoading={loginLoading}
          error={loginError}
        />
      </>
    )
  }

  // Show main application if authenticated
  return <>{children}</>
}

export default AuthWrapper
