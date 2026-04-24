'use client';

import { useState } from 'react';
import { Combobox } from '@/src/components/ui/combobox';
import { Input } from '@/src/components/ui/input';
import { useMemberName } from '@/src/hooks/apply/use-member-name';
import { COUNTRIES } from '@/src/lib/constants';
import type { HackerProfile } from '@/src/lib/types/application';
import { useApplicationStore } from '@/src/store/application.store';

interface MemberPersonalProps {
  memberIndex: number;
}

// Validation patterns
const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  github: /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/?$/,
  linkedin: /^https:\/\/linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
};

const VALIDATION_MESSAGES = {
  email: 'Please enter a valid email address',
  github: 'GitHub URL must be in format: https://github.com/username',
  linkedin: 'LinkedIn URL must be in format: https://linkedin.com/in/username',
};

export function MemberPersonal({ memberIndex }: MemberPersonalProps) {
  const { formData, addMember, updateMember } = useApplicationStore();
  const [error, _setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const member = formData.members[memberIndex - 1];
  const memberName = useMemberName(memberIndex);

  const validateField = (field: string, value: string): string | null => {
    if (!value) return null; // Empty fields are handled by required validation elsewhere

    if (field === 'email' && !VALIDATION.email.test(value)) {
      return VALIDATION_MESSAGES.email;
    }
    if (field === 'githubProfile' && !VALIDATION.github.test(value)) {
      return VALIDATION_MESSAGES.github;
    }
    if (field === 'linkedinProfile' && !VALIDATION.linkedin.test(value)) {
      return VALIDATION_MESSAGES.linkedin;
    }
    return null;
  };

  const handleChange = (field: string, value: string | number) => {
    // Validate field
    const fieldError = validateField(field, value as string);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (fieldError) {
        updated[field] = fieldError;
      } else {
        delete updated[field];
      }
      return updated;
    });

    if (!member) {
      // Create new member object if doesn't exist
      const newMember: HackerProfile = {
        fullName: '',
        country: '',
        githubProfile: '',
        email: '',
        linkedinProfile: '',
        age: 0,
        builderDescription: '',
        education: '',
        roles: [],
        isVeteran: undefined as any,
        shirtSize: '' as any,
        diet: '' as any,
        shareWithSponsors: true,
      };
      if (field === 'fullName') newMember.fullName = value as string;
      else if (field === 'country') newMember.country = value as string;
      else if (field === 'githubProfile')
        newMember.githubProfile = value as string;
      else if (field === 'email') newMember.email = value as string;
      else if (field === 'linkedinProfile')
        newMember.linkedinProfile = value as string;
      else if (field === 'age') newMember.age = value as number;
      addMember(newMember);
    } else {
      updateMember(memberIndex - 1, {
        [field]: value,
      } as Partial<HackerProfile>);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-3xl">{memberName}.inspect</h2>

      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <div className="mb-2 block font-semibold text-sm">
            nombre y apellido *
          </div>
          <Input
            type="text"
            placeholder="john hacker doe"
            value={member?.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="border-border bg-card text-foreground"
          />
        </div>

        {/* Country */}
        <div>
          <div className="mb-2 block font-semibold text-sm">país *</div>
          <Combobox
            options={COUNTRIES.map((country) => ({
              value: country.code,
              label: country.name,
              emoji: country.emoji,
            }))}
            value={member?.country || ''}
            onValueChange={(value) => handleChange('country', value)}
            placeholder="select country..."
            searchPlaceholder="search countries..."
            emptyText="no country found."
          />
        </div>

        {/* GitHub Profile */}
        <div>
          <div className="mb-2 block font-semibold text-sm">
            perfil de github *
          </div>
          <p className="mb-2 text-secondary-foreground text-xs">
            si aún no tienes, créalo. será tu id en el evento
          </p>
          <Input
            type="text"
            placeholder="https://github.com/karpathy"
            value={member?.githubProfile || ''}
            onChange={(e) => handleChange('githubProfile', e.target.value)}
            className={`bg-card text-foreground ${
              fieldErrors.githubProfile ? 'border-destructive' : 'border-border'
            }`}
          />
          {fieldErrors.githubProfile && (
            <p className="mt-1 text-destructive text-xs">
              {fieldErrors.githubProfile}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="mb-2 block font-semibold text-sm">email *</div>
          <p className="mb-2 text-secondary-foreground text-xs">
            usa el mismo de github
          </p>
          <Input
            type="email"
            placeholder="me@hacker.dev"
            value={member?.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`bg-card text-foreground ${
              fieldErrors.email ? 'border-destructive' : 'border-border'
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-destructive text-xs">{fieldErrors.email}</p>
          )}
        </div>

        {/* LinkedIn Profile */}
        <div>
          <div className="mb-2 block font-semibold text-sm">
            perfil de linkedin *
          </div>
          <Input
            type="text"
            placeholder="https://linkedin.com/in/username"
            value={member?.linkedinProfile || ''}
            onChange={(e) => handleChange('linkedinProfile', e.target.value)}
            className={`bg-card text-foreground ${
              fieldErrors.linkedinProfile
                ? 'border-destructive'
                : 'border-border'
            }`}
          />
          {fieldErrors.linkedinProfile && (
            <p className="mt-1 text-destructive text-xs">
              {fieldErrors.linkedinProfile}
            </p>
          )}
        </div>

        {/* Age */}
        <div>
          <div className="mb-2 block font-semibold text-sm">edad *</div>
          <Input
            type="number"
            placeholder="23"
            value={member?.age || ''}
            onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
            className="border-border bg-card text-foreground"
          />
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>
    </div>
  );
}
