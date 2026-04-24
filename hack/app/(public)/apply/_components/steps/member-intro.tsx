'use client';

import { useMemberName } from '@/src/hooks/apply/use-member-name';

interface MemberIntroProps {
  memberIndex: number;
}

export function MemberIntro({ memberIndex }: MemberIntroProps) {
  const memberName = useMemberName(memberIndex);

  return (
    <div className="space-y-8">
      <p className="text-secondary-foreground text-xl">
        empecemos con la info del {memberName}
      </p>
    </div>
  );
}
