import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getAdminsWithLastLogin } from '@/src/queries/admins';
import { CreateAdminDialog } from './_components/create-admin-dialog';
import { UsersTable } from './_components/users-table';

export const metadata = generateAdminMetadata('Admin Users');

export default async function UsersPage() {
  const currentUser = await onlyAdminFull();
  const users = await getAdminsWithLastLogin();

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">
            Manage admin users and their roles
          </p>
        </div>
        <CreateAdminDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admin Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div>Loading users...</div>}>
            <UsersTable users={users} currentUserEmail={currentUser.email} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
