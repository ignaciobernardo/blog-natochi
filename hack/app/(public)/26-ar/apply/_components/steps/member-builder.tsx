'use client';

import { useMemberName } from '@/src/hooks/apply/use-member-name';
import { useApplicationStore } from '@/src/store/application.store';

interface MemberBuilderProps {
  memberIndex: number;
}

const MIN_LENGTH = 20;
const MAX_LENGTH = 2000;

export function MemberBuilder({ memberIndex }: MemberBuilderProps) {
  const { formData, updateMember } = useApplicationStore();

  const member = formData.members[memberIndex - 1];
  const descriptionLength = member?.builderDescription?.length || 0;

  const handleChange = (value: string) => {
    updateMember(memberIndex - 1, { builderDescription: value });
  };

  const memberName = useMemberName(memberIndex);

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">{memberName}.builder?</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p>
          cuéntanos lo más interesante que hayas{' '}
          <span className="text-foreground">
            creado, hackeado o experimentado
          </span>
          . idealmente relacionado con software / hardware, pero no exclusivo a
          eso.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <textarea
            placeholder="construí temple os"
            value={member?.builderDescription || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="min-h-[200px] w-full rounded border border-border bg-card px-4 py-3 text-foreground placeholder-secondary-foreground focus:border-primary focus:outline-none"
          />
          <div className="flex items-center justify-between text-xs">
            <div>
              {descriptionLength > 0 && descriptionLength < MIN_LENGTH && (
                <span className="text-secondary-foreground">
                  {MIN_LENGTH - descriptionLength} characters needed
                </span>
              )}
              {descriptionLength > MAX_LENGTH && (
                <span className="text-destructive">
                  Description is too long ({descriptionLength}/{MAX_LENGTH})
                </span>
              )}
            </div>
            <span className="text-secondary-foreground">
              {descriptionLength}/{MAX_LENGTH}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
