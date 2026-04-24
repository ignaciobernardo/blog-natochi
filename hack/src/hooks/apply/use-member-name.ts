'use client';

import { useApplicationStore } from '@/src/store/application.store';

export const useMemberName = (memberIndex: number): string => {
  const { formData } = useApplicationStore();
  const isFormedTeam =
    formData.modality === 'team' && formData.teamStatus === 'formed';
  const memberNames = isFormedTeam
    ? ['team_leader', 'hacker2', 'hacker3', 'hacker4', 'hacker5']
    : ['hacker', 'hacker2', 'hacker3', 'hacker4', 'hacker5'];

  return memberNames[memberIndex - 1] || `hacker${memberIndex}`;
};
