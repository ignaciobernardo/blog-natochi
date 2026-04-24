import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getAllArcadeChallenges } from '@/src/queries/arcade-games';
import { getAllEvents } from '@/src/queries/events';
import { ArcadeChallengesTable } from './_components/arcade-challenges-table';
import { CreateArcadeChallengeDialog } from './_components/create-arcade-challenge-dialog';

export const metadata = generateAdminMetadata('Arcade Challenges');

export default async function ArcadeChallengesPage() {
  await onlyAdminFull();

  const [challenges, events] = await Promise.all([
    getAllArcadeChallenges(),
    getAllEvents(),
  ]);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Arcade Challenges
          </h1>
          <p className="text-muted-foreground">
            Manage challenge windows and event assignments for the arcade.
          </p>
        </div>
        <CreateArcadeChallengeDialog events={events} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Arcade Challenges ({challenges.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div>Loading arcade challenges...</div>}>
            <ArcadeChallengesTable challenges={challenges} events={events} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
