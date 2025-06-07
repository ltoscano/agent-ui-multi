'use client'

import { type FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { logout, getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import LogoutConfirmModal from '@/components/auth/LogoutConfirmModal'

const ChatHeader: FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { username } = getCurrentUser()

  const handleLogoutClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Logged out successfully')
      // Reload the page to trigger the auth check
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    } finally {
      setIsLoggingOut(false)
      setShowConfirmModal(false)
    }
  }

  const handleCloseModal = () => {
    if (!isLoggingOut) {
      setShowConfirmModal(false)
    }
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-end gap-3 border-b border-border/50 bg-background/95 backdrop-blur-sm px-6 py-3">
      {username && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon type="user-outline" size="xs" className="mr-0" />
          <span>User:</span>
          <span className="font-medium text-secondary">{username}</span>
        </div>
      )}
      
      <Button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        variant="outline"
        size="sm"
        className="h-8 rounded-lg border-destructive/50 text-xs font-medium text-destructive hover:bg-destructive/10 hover:border-destructive/30"
      >
        {isLoggingOut ? (
          <>
            <Icon type="loader" size="xs" className="mr-1 animate-spin" />
            Logging out...
          </>
        ) : (
          <>
            <Icon type="log-in" size="xs" className="mr-1" />
            Logout
          </>
        )}
      </Button>
      
      <LogoutConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  )
}

export default ChatHeader
