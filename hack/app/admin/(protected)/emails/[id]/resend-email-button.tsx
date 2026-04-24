'use client';

import { Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/ui/button';
import { resendEmailAction } from './resend-email.action';

interface ResendEmailButtonProps {
  emailId: string;
}

export function ResendEmailButton({ emailId }: ResendEmailButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const router = useRouter();

  const handleResend = () => {
    startTransition(async () => {
      const result = await resendEmailAction(emailId);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Email resent successfully!',
        });
        router.refresh();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to resend email',
        });
      }

      setTimeout(() => setMessage(null), 5000);
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleResend} disabled={isPending} className="w-full">
        <Mail className="mr-2 h-4 w-4" />
        {isPending ? 'Resending...' : 'Resend Email'}
      </Button>

      {message && (
        <div
          className={`rounded-md border p-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
