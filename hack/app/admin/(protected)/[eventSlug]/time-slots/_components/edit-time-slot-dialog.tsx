'use client';

import { useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { useFormAction } from '@/src/hooks/use-form-action';
import { type TimeSlot, timeSlotTargets } from '@/src/lib/db/schema';
import {
  type TimeSlotFormData,
  timeSlotFormSchema,
} from '@/src/lib/schemas/time-slots.schema';
import { updateTimeSlotAction } from '../_actions/update-time-slot.action';

interface EditTimeSlotDialogProps {
  timeSlot: TimeSlot;
  open: boolean;
  onClose: () => void;
}

export function EditTimeSlotDialog({
  timeSlot,
  open,
  onClose,
}: EditTimeSlotDialogProps) {
  const { form, handleSubmit, serverState, isPending } =
    useFormAction<TimeSlotFormData>({
      schema: timeSlotFormSchema,
      action: async (data) => updateTimeSlotAction(timeSlot.id, data),
      defaultValues: {
        eventId: timeSlot.eventId,
        title: timeSlot.title,
        description: timeSlot.description || '',
        startTime: new Date(timeSlot.startTime),
        endTime: new Date(timeSlot.endTime),
        location: timeSlot.location || '',
        color: timeSlot.color,
        target: timeSlot.target,
      },
      onSuccess: () => {
        onClose();
        window.location.reload();
      },
    });

  useEffect(() => {
    form.reset({
      eventId: timeSlot.eventId,
      title: timeSlot.title,
      description: timeSlot.description || '',
      startTime: new Date(timeSlot.startTime),
      endTime: new Date(timeSlot.endTime),
      location: timeSlot.location || '',
      color: timeSlot.color,
      target: timeSlot.target,
    });
  }, [timeSlot, form]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Time Slot</DialogTitle>
          <DialogDescription>
            Update the time slot information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Opening Ceremony"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the event..."
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
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isPending}
                        value={
                          field.value
                            ? new Date(
                                field.value.getTime() -
                                  field.value.getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isPending}
                        value={
                          field.value
                            ? new Date(
                                field.value.getTime() -
                                  field.value.getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Main Hall"
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
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            disabled={isPending}
                            {...field}
                            className="h-10 w-20"
                          />
                          <Input
                            type="text"
                            disabled={isPending}
                            {...field}
                            placeholder="#f1c40f"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          {[
                            { name: 'Primary Yellow', value: '#e1ff00' },
                            {
                              name: 'Primary Yellow (Transparent)',
                              value: '#e1ff0033',
                            },
                            { name: 'Red', value: '#ea1414' },
                            { name: 'Gray', value: '#d1d5d1' },
                            { name: 'Dark Gray', value: '#333333' },
                            { name: 'Black', value: '#000000' },
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => field.onChange(color.value)}
                              disabled={isPending}
                              className="h-8 w-8 rounded border-2 transition-all hover:scale-110"
                              style={{
                                backgroundColor: color.value,
                                borderColor:
                                  field.value === color.value
                                    ? '#333'
                                    : 'transparent',
                              }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="target"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Target Audience</FormLabel>
                    <FormDescription>
                      Select who this time slot is relevant for
                    </FormDescription>
                  </div>
                  {timeSlotTargets.map((target) => (
                    <FormField
                      key={target}
                      control={form.control}
                      name="target"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(target)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, target]);
                                } else {
                                  field.onChange(
                                    current.filter((value) => value !== target),
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {target}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
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

            {serverState.success && serverState.message && (
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-green-600 text-sm">{serverState.message}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Updating...' : 'Update Time Slot'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
