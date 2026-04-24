'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/src/components/ui/switch';
import { toggleJobAction } from '../_actions/toggle-job.action';

interface JobToggleProps {
  jobName: string;
  enabled: boolean;
}

export function JobToggle({ jobName, enabled }: JobToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);

    startTransition(async () => {
      const result = await toggleJobAction(jobName, checked);

      if (!result.success) {
        setIsEnabled(!checked);
        toast.error(result.error || 'Failed to toggle job');
      } else {
        toast.success(result.message);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <span className="text-muted-foreground text-sm">
        {isEnabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}
