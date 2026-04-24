'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
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
import {
  type MentorFormData,
  mentorFormSchema,
} from '@/src/lib/schemas/mentor.schema';
import { createMentorAction } from '../_actions/mentor.actions';

interface CreateMentorDialogProps {
  eventSlug: string;
}

export function CreateMentorDialog({ eventSlug }: CreateMentorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<MentorFormData>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      fullName: '',
      github: '',
      linkedin: '',
      pictureUrl: '',
      companyTitle: '',
    },
  });

  const onSubmit = (data: MentorFormData) => {
    startTransition(async () => {
      const result = await createMentorAction(data, eventSlug);
      if (result.success) {
        toast({
          type: 'success',
          description: result.message || 'Mentor created',
        });
        form.reset();
        setOpen(false);
      } else {
        toast({
          type: 'error',
          description: result.globalError || 'Failed to create mentor',
        });
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Mentor
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Mentor</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pictureUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Picture URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/photo.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company / Title (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Software Engineer at Acme Inc"
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
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Mentor'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
