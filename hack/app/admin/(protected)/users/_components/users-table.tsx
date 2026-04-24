'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/src/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { AdminWithLastLogin } from '@/src/queries/admins';
import { DeleteAdminDialog } from './delete-admin-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

interface UsersTableProps {
  users: AdminWithLastLogin[];
  currentUserEmail: string;
}

export function UsersTable({ users, currentUserEmail }: UsersTableProps) {
  const roleColors: Record<string, string> = {
    full: 'bg-blue-100 text-blue-800 border-blue-300',
    guest: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const roleLabels: Record<string, string> = {
    full: 'Full Access',
    guest: 'Guest',
  };

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No admin users found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead className="w-[250px]">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium text-sm">{user.fullName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt ? (
                    <div className="space-y-1">
                      <div className="text-sm">
                        {new Date(user.lastLoginAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(user.lastLoginAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Never logged in
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ResetPasswordDialog
                      adminEmail={user.email}
                      adminName={user.fullName}
                    />
                    {user.email !== currentUserEmail && (
                      <DeleteAdminDialog
                        adminEmail={user.email}
                        adminName={user.fullName}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
