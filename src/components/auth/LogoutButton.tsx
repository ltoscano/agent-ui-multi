'use client'

import { type FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { logout, getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import LogoutConfirmModal from './LogoutConfirmModal'

const LogoutButton: FC = () => {
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
    <div className="space-y-3">
      {username && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-accent p-3">
          <Icon type="user" size="xs" className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {username}
          </span>
        </div>
      )}
      
      <Button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        variant="outline"
        size="lg"
        className="h-9 w-full rounded-xl border-destructive/20 text-xs font-medium text-destructive hover:bg-destructive/10 hover:border-destructive/30"
      >
        {isLoggingOut ? (
          <>
            <Icon type="loader" size="xs" className="animate-spin" />
            <span className="uppercase">Logging out...</span>
          </>
        ) : (
          <>
            <Icon type="x" size="xs" />
            <span className="uppercase">Logout</span>
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

export default LogoutButton
