'use client';

import { useState } from 'react';
import { useMemberName } from '@/src/hooks/apply/use-member-name';
import type { HackerRole } from '@/src/lib/types/application';
import { useApplicationStore } from '@/src/store/application.store';

interface MemberRoleProps {
  memberIndex: number;
}

const roleOptions: { value: HackerRole; label: string; emoji: string }[] = [
  { value: 'desarrollo', label: 'Desarrollo', emoji: '💻' },
  { value: 'producto', label: 'Producto', emoji: '📱' },
  { value: 'diseno', label: 'Diseño', emoji: '🎨' },
  { value: 'ventas', label: 'Ventas', emoji: '💼' },
  { value: 'qa', label: 'QA', emoji: '🔍' },
];

export function MemberRole({ memberIndex }: MemberRoleProps) {
  const { formData, updateMember } = useApplicationStore();
  const [error, setError] = useState<string | null>(null);

  const member = formData.members[memberIndex - 1];
  const selectedRoles = member?.roles || [];

  const toggleRole = (role: HackerRole) => {
    const currentRoles = member?.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    updateMember(memberIndex - 1, { roles: newRoles });
    setError(null);
  };

  const memberName = useMemberName(memberIndex);

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">{memberName}.role</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p className="text-lg">
          En cuál de los siguientes tienes{' '}
          <span className="text-foreground">*experiencia verificable*</span>?
        </p>
        <p className="text-sm">puedes elegir más de uno</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3">
          {roleOptions.map((option) => {
            const isSelected = selectedRoles.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleRole(option.value)}
                className={`flex items-center gap-3 rounded border px-6 py-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-lg">{option.label}</span>
                {isSelected && <span className="ml-auto text-primary">✓</span>}
              </button>
            );
          })}
        </div>
        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>
    </div>
  );
}
