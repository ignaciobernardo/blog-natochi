import { notFound } from 'next/navigation';
import { getHackerStatusByPublicId } from '@/src/queries/hackers';
import { getSubmissionStatusHistory } from '@/src/queries/submissions';
import { SelfFinanceFlightForm } from './_components/self-finance-flight-form';
import { SelfFinanceResponseReceived } from './_components/self-finance-response-received';

export default async function SelfFinanceFlightPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const statusData = await getHackerStatusByPublicId(publicId);

  if (!statusData) {
    notFound();
  }

  const statusHistory = await getSubmissionStatusHistory(
    statusData.submission.id,
  );

  const hasAskingSelfFinanceTrip = statusHistory.some(
    (h) => h.toStatus === 'asking_self_finance_trip',
  );

  if (!hasAskingSelfFinanceTrip) {
    notFound();
  }

  const currentStatus = statusData.submission.status;
  const isStillAsking = currentStatus === 'asking_self_finance_trip';

  if (!isStillAsking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-8 md:right-8">
            <div
              className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                maskImage: 'url(/assets/logos/platanus.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </div>

          <div className="mx-auto w-full max-w-3xl">
            <SelfFinanceResponseReceived
              currentStatus={currentStatus}
              modality={statusData.submission.modality}
            />
          </div>
        </div>
      </div>
    );
  }

  const askingStatusChange = statusHistory.find(
    (h) => h.toStatus === 'asking_self_finance_trip',
  );

  if (!askingStatusChange) {
    notFound();
  }

  const deadline = new Date(askingStatusChange.changedAt);
  deadline.setHours(deadline.getHours() + 48);

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative mx-auto px-4 py-12 md:py-16">
        <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-8 md:right-8">
          <div
            className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              maskImage: 'url(/assets/logos/platanus.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <SelfFinanceFlightForm
            publicId={publicId}
            submissionId={statusData.submission.id}
            deadline={deadline}
            hackerName={statusData.hacker.fullName}
            isTeam={statusData.submission.isTeam}
            modality={statusData.submission.modality}
            teamMembers={statusData.teamMembers}
          />
        </div>
      </div>
    </div>
  );
}
