'use client';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
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
import { useFormAction } from '@/src/hooks/use-form-action';
import {
  type UpdateProjectFormData,
  updateProjectFormSchema,
} from '@/src/lib/schemas/project-admin.schema';
import { updateProjectAction } from '../_actions/update-project.action';

interface EditProjectFormProps {
  projectId: string;
  currentOnelinerShort: string | null;
}

export function EditProjectForm({
  projectId,
  currentOnelinerShort,
}: EditProjectFormProps) {
  const { form, handleSubmit, serverState, isPending } =
    useFormAction<UpdateProjectFormData>({
      schema: updateProjectFormSchema,
      action: async (data) => updateProjectAction(projectId, data),
      defaultValues: {
        onelinerShort: currentOnelinerShort || '',
      },
    });

  const onelinerShortValue = form.watch('onelinerShort');
  const characterCount = onelinerShortValue?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Project</CardTitle>
        <CardDescription>
          Update project details for voting and social sharing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="onelinerShort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Oneliner (Spanish)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Mejora tu oratoria con análisis IA"
                      disabled={isPending}
                      {...field}
                      maxLength={60}
                    />
                  </FormControl>
                  <FormDescription>
                    A concise description in Spanish (max 60 characters) for
                    OpenGraph images and voting pages.{' '}
                    <span
                      className={
                        characterCount > 60
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }
                    >
                      {characterCount}/60 characters
                    </span>
                  </FormDescription>
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

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
