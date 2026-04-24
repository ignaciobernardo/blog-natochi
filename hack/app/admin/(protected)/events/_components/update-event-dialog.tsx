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
import { useFormAction } from '@/src/hooks/use-form-action';
import type { Event } from '@/src/lib/db/schema';
import {
  type UpdateEventFormData,
  updateEventSchema,
} from '@/src/lib/schemas/event.schema';
import { chileDateToDateTimeLocal } from '@/src/lib/utils/timezone';
import { updateEventAction } from '../_actions/update-event.action';

interface UpdateEventDialogProps {
  event: Event;
}

export function UpdateEventDialog({ event }: UpdateEventDialogProps) {
  const [open, setOpen] = useState(false);

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<UpdateEventFormData>({
      schema: updateEventSchema,
      action: updateEventAction,
      defaultValues: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        domain: event.domain,
        photosAlbumUrl: event.photosAlbumUrl ?? undefined,
        priorityAnswerDate: chileDateToDateTimeLocal(event.priorityAnswerDate),
        priorityDeadlineAt: chileDateToDateTimeLocal(event.priorityDeadlineAt),
        finalDeadlineAt: chileDateToDateTimeLocal(event.finalDeadlineAt),
        startsAt: chileDateToDateTimeLocal(event.startsAt),
        endsAt: chileDateToDateTimeLocal(event.endsAt),
        rsvpOpenAt: chileDateToDateTimeLocal(event.rsvpOpenAt),
        votingStartsAt: chileDateToDateTimeLocal(event.votingStartsAt),
        votingEndsAt: chileDateToDateTimeLocal(event.votingEndsAt),
        trackSelectionStartTime: chileDateToDateTimeLocal(
          event.trackSelectionStartTime,
        ),
        mentorSelectionStartTime: chileDateToDateTimeLocal(
          event.mentorSelectionStartTime,
        ),
        feedbackPrizeDeadline: chileDateToDateTimeLocal(
          event.feedbackPrizeDeadline,
        ),
        capacityTeams: event.capacityTeams ?? undefined,
        capacityHackers: event.capacityHackers ?? undefined,
        targetSubmission: event.targetSubmission ?? undefined,
        trackTeamLimit: event.trackTeamLimit ?? undefined,
        mentorTeamLimit: event.mentorTeamLimit ?? undefined,
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Event</DialogTitle>
            <DialogDescription>
              Update the event details, dates, and capacity.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Platanus Hack 2025"
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
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="25" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain (with protocol)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://hack.platan.us"
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
                name="photosAlbumUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photos Album URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://photos.app.goo.gl/..."
                        disabled={isPending}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priorityAnswerDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Answer Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priorityDeadlineAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="finalDeadlineAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rsvpOpenAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RSVP Opens At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackSelectionStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track Selection Starts At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="votingStartsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Starts At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="votingEndsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Ends At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mentorSelectionStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mentor Selection Starts At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feedbackPrizeDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Prize Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="capacityTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Teams)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacityHackers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Hackers)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetSubmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Submission</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackTeamLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track Team Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="mentorTeamLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mentor Team Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
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

              {serverState.success && serverState.message && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <p className="text-green-600 text-sm">
                    {serverState.message}
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
                  {isPending ? 'Updating...' : 'Update Event'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
