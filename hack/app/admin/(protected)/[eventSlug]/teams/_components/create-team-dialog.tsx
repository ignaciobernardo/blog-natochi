'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useFormAction } from '@/src/hooks/use-form-action';
import {
  type CreateTeamFormData,
  createTeamFormSchema,
} from '@/src/lib/schemas/teams.schema';
import { createTeamAction } from '../_actions/teams.actions';

interface CreateTeamDialogProps {
  eventId: string;
  eventSlug?: string;
}

export function CreateTeamDialog({ eventId }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<CreateTeamFormData>({
      schema: createTeamFormSchema,
      action: async (data) => {
        const result = await createTeamAction({ ...data, eventId });
        if (result.success) {
          setOpen(false);
        }
        return result;
      },
      defaultValues: {
        slug: '',
        tableNumber: '',
      },
      onSuccess: () => {
        form.reset();
      },
    });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Team
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for the hackathon
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., team-awesome"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 1A"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverState.globalError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-red-600 text-sm">
                    {serverState.globalError}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
