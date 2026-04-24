'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from '@/src/components/toast';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { Mentor } from '@/src/lib/db/schema';
import {
  type MentorFormData,
  mentorFormSchema,
} from '@/src/lib/schemas/mentor.schema';
import { updateMentorAction } from '../_actions/mentor.actions';

interface EditMentorDialogProps {
  eventSlug: string;
  mentor: Mentor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMentorDialog({
  eventSlug,
  mentor,
  open,
  onOpenChange,
}: EditMentorDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<MentorFormData>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      fullName: '',
      github: '',
      linkedin: '',
      pictureUrl: '',
      companyTitle: '',
      availability: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'availability',
  });

  useEffect(() => {
    if (mentor) {
      form.reset({
        fullName: mentor.fullName,
        github: mentor.github,
        linkedin: mentor.linkedin || '',
        pictureUrl: mentor.pictureUrl || '',
        companyTitle: mentor.companyTitle || '',
        availability: mentor.availability || [],
      });
    }
  }, [mentor, form]);

  const onSubmit = (data: MentorFormData) => {
    if (!mentor) return;

    startTransition(async () => {
      const result = await updateMentorAction(mentor.id, data, eventSlug);
      if (result.success) {
        toast({
          type: 'success',
          description: result.message || 'Mentor updated',
        });
        onOpenChange(false);
      } else {
        toast({
          type: 'error',
          description: result.globalError || 'Failed to update mentor',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Mentor</DialogTitle>
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
                      placeholder="/assets/images/mentors/photo.jpg"
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Availability Schedule</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      day: 'friday',
                      startTime: '18:00',
                      endTime: '23:00',
                      tentative: false,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No availability slots added yet.
                </p>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 rounded-md border p-3"
                >
                  <FormField
                    control={form.control}
                    name={`availability.${index}.day`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="friday">Friday</SelectItem>
                              <SelectItem value="saturday">Saturday</SelectItem>
                              <SelectItem value="sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`availability.${index}.startTime`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="18:00" {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`availability.${index}.endTime`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="23:00" {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`availability.${index}.tentative`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 text-sm">TBC</FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

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
