import { type FC } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isLoggingOut: boolean
}

const LogoutConfirmModal: FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="font-geist">
      <DialogHeader>
        <DialogTitle>Confirm logout</DialogTitle>
        <DialogDescription>
          Are you sure you want to logout? You will need to login again to access the application.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          className="rounded-xl border-border font-geist"
          onClick={onClose}
          disabled={isLoggingOut}
        >
          CANCEL
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isLoggingOut}
          className="rounded-xl font-geist"
        >
          LOGOUT
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default LogoutConfirmModal
