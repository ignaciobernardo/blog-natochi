import { notFound } from 'next/navigation';
import { getHackerStatusByPublicId } from '@/src/queries/hackers';
import { WaitingListForm } from './_components/waiting-list-form';
import { WaitingListResponseReceived } from './_components/waiting-list-response-received';

export default async function WaitingListPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const statusData = await getHackerStatusByPublicId(publicId);

  if (!statusData) {
    notFound();
  }

  const currentStatus = statusData.submission.status;

  // Only show form if status is 'rejected'
  if (currentStatus !== 'rejected' && currentStatus !== 'waiting_list') {
    notFound();
  }

  // If already in waiting list, show confirmation
  if (currentStatus === 'waiting_list') {
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
            <WaitingListResponseReceived
              modality={statusData.submission.modality}
            />
          </div>
        </div>
      </div>
    );
  }

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
          <WaitingListForm
            publicId={publicId}
            submissionId={statusData.submission.id}
            hackerName={statusData.hacker.fullName}
            isTeam={statusData.submission.isTeam}
            modality={statusData.submission.modality}
            hackerGender={statusData.hacker.gender}
            teamMembers={statusData.teamMembers}
          />
        </div>
      </div>
    </div>
  );
}
