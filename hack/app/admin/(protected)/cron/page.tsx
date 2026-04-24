import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { cronJobs, getNextRunDate } from '@/src/jobs/cron';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAllCronjobs } from '@/src/queries/cronjobs';
import { ForceRunButton } from './_components/force-run-button';
import { JobToggle } from './_components/job-toggle';

export const metadata = generateAdminMetadata('Cron Jobs');

export default async function CronPage() {
  const dbJobs = await getAllCronjobs();
  const dbJobsMap = new Map(dbJobs.map((job) => [job.jobName, job]));

  const jobsData = cronJobs.map((jobDef) => {
    const dbJob = dbJobsMap.get(jobDef.name);
    const nextRun =
      jobDef.schedule && dbJob?.lastRun
        ? getNextRunDate(jobDef.schedule, dbJob.lastRun)
        : jobDef.schedule
          ? new Date()
          : null;

    return {
      name: jobDef.name,
      schedule: jobDef.schedule,
      description: jobDef.description || 'No description',
      enabled: dbJob?.enabled ?? true,
      lastRun: dbJob?.lastRun ?? null,
      nextRun,
      returnsDownload: jobDef.returnsDownload ?? false,
    };
  });

  const scheduledJobs = jobsData.filter((job) => job.schedule !== null);
  const oneOffActions = jobsData.filter((job) => job.schedule === null);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground">
            Manage scheduled jobs and their execution
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs ({scheduledJobs.length})</CardTitle>
          <CardDescription>
            Jobs are checked every 3 seconds by the production cron ticker
            service
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No scheduled jobs configured
                  </TableCell>
                </TableRow>
              ) : (
                scheduledJobs.map((job) => (
                  <TableRow key={job.name}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {job.schedule}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {job.description}
                    </TableCell>
                    <TableCell className="text-sm">
                      {job.lastRun
                        ? formatDistanceToNow(job.lastRun, {
                            addSuffix: true,
                          })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {job.nextRun
                        ? formatDistanceToNow(job.nextRun, { addSuffix: true })
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <JobToggle jobName={job.name} enabled={job.enabled} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ForceRunButton jobName={job.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>One-Off Actions ({oneOffActions.length})</CardTitle>
          <CardDescription>
            Manual actions that can be triggered on-demand
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oneOffActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No one-off actions configured
                  </TableCell>
                </TableRow>
              ) : (
                oneOffActions.map((job) => (
                  <TableRow key={job.name}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {job.description}
                    </TableCell>
                    <TableCell className="text-sm">
                      {job.lastRun
                        ? formatDistanceToNow(job.lastRun, {
                            addSuffix: true,
                          })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <ForceRunButton
                        jobName={job.name}
                        isOneOff={true}
                        description={job.description}
                        returnsDownload={job.returnsDownload}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
