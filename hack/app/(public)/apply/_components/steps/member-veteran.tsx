'use client';

import { useState } from 'react';
import { useMemberName } from '@/src/hooks/apply/use-member-name';
import { useApplicationStore } from '@/src/store/application.store';

interface MemberVeteranProps {
  memberIndex: number;
}

export function MemberVeteran({ memberIndex }: MemberVeteranProps) {
  const { formData, updateMember } = useApplicationStore();
  const [error, setError] = useState<string | null>(null);

  const member = formData.members[memberIndex - 1];

  const handleVeteranToggle = (isVeteran: boolean) => {
    updateMember(memberIndex - 1, { isVeteran });
    setError(null);
  };

  const handleHackathonsChange = (value: string) => {
    updateMember(memberIndex - 1, { previousHackathons: value });
    setError(null);
  };

  const memberName = useMemberName(memberIndex);

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">{memberName}.veteran?</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p>has participado de otras hackatones?</p>
      </div>

      {/* Veteran Radio Options */}
      <div className="mb-8 space-y-4">
        <div className="mb-3 block font-semibold text-sm">veteran? *</div>

        <label
          className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
            member?.isVeteran === true
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="radio"
            name="veteran"
            checked={member?.isVeteran === true}
            onChange={() => handleVeteranToggle(true)}
            className="sr-only"
          />
          <div>
            <div className="font-semibold">true</div>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
            member?.isVeteran === false
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="radio"
            name="veteran"
            checked={member?.isVeteran === false}
            onChange={() => handleVeteranToggle(false)}
            className="sr-only"
          />
          <div>
            <div className="font-semibold">false</div>
          </div>
        </label>
      </div>

      {/* Conditional field for hackathons */}
      {member?.isVeteran === true && (
        <div className="space-y-4">
          <div className="block font-semibold text-sm">cuáles? *</div>
          <textarea
            placeholder="platanus hack 24, treehacks 24, fecebook hack chile 21, etc"
            value={member?.previousHackathons || ''}
            onChange={(e) => handleHackathonsChange(e.target.value)}
            className="min-h-[150px] w-full rounded border border-border bg-card px-4 py-3 text-foreground placeholder-secondary-foreground focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {error && <div className="text-destructive text-sm">{error}</div>}
    </div>
  );
}
