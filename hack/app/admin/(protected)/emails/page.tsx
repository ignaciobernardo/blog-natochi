import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { emailSearchParamsSchema } from '@/src/lib/schemas/email-search.schema';
import { getOutboundEmailStats, getOutboundEmails } from '@/src/queries/emails';
import { EmailFilters } from './_components/email-filters';
import { EmailStatsCards } from './_components/email-stats-cards';
import { EmailTable } from './_components/email-table';

export const metadata = generateAdminMetadata('Email Management');

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmailsPage({ searchParams }: PageProps) {
  const awaitedParams = await searchParams;

  const parsedParams = emailSearchParamsSchema.parse({
    page: awaitedParams.page,
    limit: awaitedParams.limit,
    search: awaitedParams.search,
    status: awaitedParams.status,
    sortBy: awaitedParams.sortBy,
    sortOrder: awaitedParams.sortOrder,
  });

  const [{ emails, pagination }, stats] = await Promise.all([
    getOutboundEmails({
      page: parsedParams.page,
      limit: parsedParams.limit,
      search: parsedParams.search,
      status: parsedParams.status,
      sortBy: parsedParams.sortBy,
      sortOrder: parsedParams.sortOrder,
    }),
    getOutboundEmailStats(),
  ]);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Email Management</h1>
        <p className="text-muted-foreground">
          View and manage all outbound emails
        </p>
      </div>

      <EmailStatsCards stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading filters...</div>}>
            <EmailFilters initialParams={parsedParams} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <EmailTable emails={emails} pagination={pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
