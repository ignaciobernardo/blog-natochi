'use client';

import { Pencil } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useFormAction } from '@/src/hooks/use-form-action';
import type { Event } from '@/src/lib/db/schema';
import {
  type UpdateArcadeChallengeFormData,
  updateArcadeChallengeSchema,
} from '@/src/lib/schemas/arcade-challenge.schema';
import { chileDateToDateTimeLocal } from '@/src/lib/utils/timezone';
import type { ArcadeChallengeWithEvent } from '@/src/queries/arcade-games';
import { updateArcadeChallengeAction } from '../_actions/update-arcade-challenge.action';

interface UpdateArcadeChallengeDialogProps {
  challenge: ArcadeChallengeWithEvent;
  events: Pick<Event, 'id' | 'name' | 'slug'>[];
}

export function UpdateArcadeChallengeDialog({
  challenge,
  events,
}: UpdateArcadeChallengeDialogProps) {
  const [open, setOpen] = useState(false);

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<UpdateArcadeChallengeFormData>({
      schema: updateArcadeChallengeSchema,
      action: updateArcadeChallengeAction,
      defaultValues: {
        id: challenge.id,
        eventId: challenge.eventId,
        name: challenge.name,
        slug: challenge.slug,
        submissionDeadline: chileDateToDateTimeLocal(
          challenge.submissionDeadline,
        ),
        votingDeadline: chileDateToDateTimeLocal(challenge.votingDeadline),
      },
      onSuccess: () => {
        setOpen(false);
        window.location.reload();
      },
    });

  const handleClose = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Arcade Challenge</DialogTitle>
            <DialogDescription>
              Update the owning event and active challenge window.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} ({event.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="submissionDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
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
                  name="votingDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {serverState.globalError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-red-600 text-sm">
                    {serverState.globalError}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
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
    </>
  );
}
