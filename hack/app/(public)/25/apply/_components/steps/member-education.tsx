'use client';

import { useState } from 'react';
import { useMemberName } from '@/src/hooks/apply/use-member-name';
import { useApplicationStore } from '@/src/store/application.store';

interface MemberEducationProps {
  memberIndex: number;
}

export function MemberEducation({ memberIndex }: MemberEducationProps) {
  const { formData, updateMember } = useApplicationStore();
  const [error, setError] = useState<string | null>(null);

  const member = formData.members[memberIndex - 1];

  const handleChange = (value: string) => {
    updateMember(memberIndex - 1, { education: value });
    setError(null);
  };

  const memberName = useMemberName(memberIndex);

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">{memberName}.edu</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p>
          universidad, bootcamp, otro? describe de forma{' '}
          <span className="text-foreground">minimalista</span> qué y donde has
          estudiado, incluyendo años.
        </p>
      </div>

      <div className="space-y-4">
        <div className="block font-semibold text-sm">educación *</div>
        <textarea
          placeholder=""
          value={member?.education || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[150px] w-full rounded border border-border bg-card px-4 py-3 text-foreground placeholder-secondary-foreground focus:border-primary focus:outline-none"
        />
        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>
    </div>
  );
}
