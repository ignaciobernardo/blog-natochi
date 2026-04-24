'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/src/components/toast';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import type { Track } from '@/src/lib/db/schema';
import {
  type TrackFormData,
  trackFormSchema,
} from '@/src/lib/schemas/tracks.schema';
import { updateTrackAction } from '../_actions/track.actions';

interface EditTrackDialogProps {
  eventSlug: string;
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTrackDialog({
  eventSlug,
  track,
  open,
  onOpenChange,
}: EditTrackDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TrackFormData>({
    resolver: zodResolver(trackFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (track) {
      form.reset({
        name: track.name,
        description: track.description || '',
      });
    }
  }, [track, form]);

  const onSubmit = (data: TrackFormData) => {
    if (!track) return;

    startTransition(async () => {
      const result = await updateTrackAction(track.id, data, eventSlug);
      if (result.success) {
        toast({
          type: 'success',
          description: result.message || 'Track updated',
        });
        onOpenChange(false);
      } else {
        toast({
          type: 'error',
          description: result.globalError || 'Failed to update track',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Track</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Track Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., AI & Machine Learning"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this track"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
