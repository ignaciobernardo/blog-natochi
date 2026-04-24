'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { KeyRound } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { resetPasswordAction } from '../_actions/reset-password.action';

interface ResetPasswordDialogProps {
  adminEmail: string;
  adminName: string;
}

export function ResetPasswordDialog({
  adminEmail,
  adminName,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const handleReset = () => {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(adminEmail);

      if (result.success && result.password) {
        setNewPassword(result.password);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setNewPassword(null);
    setError(null);
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <KeyRound className="h-4 w-4 text-blue-600" />
          <span className="sr-only">Reset password</span>
        </Button>
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <AlertDialogPrimitive.Content className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg">
          {newPassword ? (
            <>
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <AlertDialogPrimitive.Title className="font-semibold text-lg">
                  Password Reset Successfully
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
                  New password for <strong>{adminName}</strong> ({adminEmail}):
                </AlertDialogPrimitive.Description>
              </div>

              <div className="rounded-md border border-blue-600 bg-blue-50 p-4">
                <p className="mb-2 text-blue-900 text-sm">
                  Please save this password securely. It will not be shown
                  again.
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="block font-medium text-blue-950 text-xs">
                        New Password:
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-blue-700 text-xs hover:bg-blue-100 hover:text-blue-900"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword);
                        }}
                      >
                        Copy Password
                      </Button>
                    </div>
                    <code className="block rounded border border-blue-300 bg-white p-2 font-mono text-blue-950 text-sm">
                      {newPassword}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                  }}
                >
                  Copy Password
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <AlertDialogPrimitive.Title className="font-semibold text-lg">
                  Reset Password
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
                  Are you sure you want to reset the password for{' '}
                  <strong>{adminName}</strong> ({adminEmail})? A new random
                  password will be generated.
                </AlertDialogPrimitive.Description>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <AlertDialogPrimitive.Cancel
                  disabled={isPending}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mt-2 sm:mt-0',
                  )}
                >
                  Cancel
                </AlertDialogPrimitive.Cancel>
                <AlertDialogPrimitive.Action
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleReset();
                  }}
                  disabled={isPending}
                  className={cn(buttonVariants())}
                >
                  {isPending ? 'Resetting...' : 'Reset Password'}
                </AlertDialogPrimitive.Action>
              </div>
            </>
          )}
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
