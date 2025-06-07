'use client'

import { type FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Icon from '@/components/ui/icon'

interface LoginModalProps {
  isOpen: boolean
  onLogin: (invitationCode: string) => Promise<void>
  isLoading: boolean
  error?: string
}

const LoginModal: FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  isLoading,
  error
}) => {
  const [invitationCode, setInvitationCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (invitationCode.trim() && !isLoading) {
      await onLogin(invitationCode.trim())
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="font-geist sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon type="key" className="h-5 w-5" />
            Login Required
          </DialogTitle>
          <DialogDescription>
            Please enter your invitation code to access the application.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor="invitation-code" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Invitation Code
            </label>
            <input
              id="invitation-code"
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              placeholder="Enter your invitation code"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              autoFocus
              maxLength={10}
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <Icon type="alert-circle" className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!invitationCode.trim() || isLoading}
              className="w-full text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon type="loader" className="mr-2 h-4 w-4 animate-spin text-black" />
                  Verifying...
                </>
              ) : (
                <>
                  <Icon type="log-in" className="mr-2 h-4 w-4 text-black" />
                  Login
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal
