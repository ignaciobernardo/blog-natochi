'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { authClient } from '@/src/lib/auth-client';

interface ImpersonationBannerProps {
  impersonatedBy: string | null;
  userName: string;
  userEmail: string;
}

export function ImpersonationBanner({
  impersonatedBy,
  userName,
  userEmail,
}: ImpersonationBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!impersonatedBy) {
    return null;
  }

  const handleStopImpersonating = async () => {
    setIsLoading(true);
    try {
      await authClient.admin.stopImpersonating();
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Failed to stop impersonating:', error);
      setIsLoading(false);
    }
  };

  return (
    <Alert className="sticky top-0 z-50 rounded-none border-orange-600 border-b-2 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-900">
          <span className="font-semibold">Impersonating:</span>
          <span>
            {userName} ({userEmail})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonating}
          disabled={isLoading}
          className="border-orange-600 text-orange-600 hover:bg-orange-100"
        >
          <X className="mr-1 h-3 w-3" />
          {isLoading ? 'Stopping...' : 'Stop Impersonating'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
