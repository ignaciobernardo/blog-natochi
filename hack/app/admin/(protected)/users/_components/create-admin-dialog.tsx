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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useFormAction } from '@/src/hooks/use-form-action';
import {
  type CreateAdminFormData,
  createAdminSchema,
} from '@/src/lib/schemas/admin.schema';
import { createAdminAction } from '../_actions/create-admin.action';

export function CreateAdminDialog() {
  const [open, setOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<CreateAdminFormData>({
      schema: createAdminSchema,
      action: async (data) => {
        const result = await createAdminAction(data);
        if (result.success && 'password' in result && result.password) {
          setGeneratedPassword(result.password);
        }
        return result;
      },
      defaultValues: {
        email: '',
        fullName: '',
        role: 'guest',
      },
      onSuccess: () => {
        form.reset();
      },
    });

  const handleClose = () => {
    setOpen(false);
    setGeneratedPassword(null);
    form.reset();
    if (serverState.success) {
      window.location.reload();
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Admin User
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>
              Create a new admin user with a randomly generated password.
            </DialogDescription>
          </DialogHeader>

          {generatedPassword ? (
            <div className="space-y-4">
              <div className="rounded-md border border-green-600 bg-green-50 p-4">
                <h3 className="mb-2 font-semibold text-green-950 text-sm">
                  Admin User Created Successfully!
                </h3>
                <p className="mb-3 text-green-900 text-sm">
                  Please save this password securely. It will not be shown
                  again.
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 block font-medium text-green-950 text-xs">
                      Email:
                    </div>
                    <code className="block rounded border border-green-300 bg-white p-2 font-mono text-green-950 text-sm">
                      {form.getValues('email')}
                    </code>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="block font-medium text-green-950 text-xs">
                        Password:
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-green-700 text-xs hover:bg-green-100 hover:text-green-900"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                        }}
                      >
                        Copy Password
                      </Button>
                    </div>
                    <code className="block rounded border border-green-300 bg-white p-2 font-mono text-green-950 text-sm">
                      {generatedPassword}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Email: ${form.getValues('email')}\nPassword: ${generatedPassword}`,
                    );
                  }}
                >
                  Copy All Credentials
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full">Full Access</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
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
                    {isPending ? 'Creating...' : 'Create Admin User'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
