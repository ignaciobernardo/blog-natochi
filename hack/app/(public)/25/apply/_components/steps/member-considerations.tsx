'use client';

import { Input } from '@/src/components/ui/input';
import { useMemberName } from '@/src/hooks/apply/use-member-name';
import type { Diet, ShirtSize } from '@/src/lib/types/application';
import { useApplicationStore } from '@/src/store/application.store';

interface MemberConsiderationsProps {
  memberIndex: number;
}

const SHIRT_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL'];
const DIETS: Diet[] = ['omnivora', 'vegetariana', 'vegana'];

export function MemberConsiderations({
  memberIndex,
}: MemberConsiderationsProps) {
  const { formData, updateMember } = useApplicationStore();

  const member = formData.members[memberIndex - 1];

  const handleChange = (field: string, value: any) => {
    updateMember(memberIndex - 1, { [field]: value });
  };

  const _memberName = useMemberName(memberIndex);

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">alguna consideración?</h2>

      {/* Shirt Size */}
      <div className="space-y-4">
        <div className="block font-semibold text-sm">
          qué tamaño de polera usas? 👕 *
        </div>
        <div className="space-y-2">
          {SHIRT_SIZES.map((size) => (
            <label
              key={size}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                member?.shirtSize === size
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-transparent'
              }`}
            >
              <input
                type="radio"
                name="shirtSize"
                value={size}
                checked={member?.shirtSize === size}
                onChange={() => handleChange('shirtSize', size)}
                className="sr-only"
              />
              <span className="font-semibold">{size}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Diet */}
      <div className="space-y-4">
        <div className="block font-semibold text-sm">que dieta tienes? *</div>
        <div className="space-y-2">
          {DIETS.map((diet) => {
            const icons: Record<Diet, string> = {
              omnivora: '🍖',
              vegetariana: '⚪',
              vegana: '🌱',
            };
            return (
              <label
                key={diet}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                  member?.diet === diet
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="diet"
                  value={diet}
                  checked={member?.diet === diet}
                  onChange={() => handleChange('diet', diet)}
                  className="sr-only"
                />
                <span className="text-lg">{icons[diet]}</span>
                <span className="font-semibold">{diet}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Food Allergies */}
      <div className="space-y-4">
        <div className="block font-semibold text-sm">
          alergias alimenticias?
        </div>
        <p className="text-secondary-foreground text-xs">
          deja en blanco si no tienes
        </p>
        <Input
          type="text"
          placeholder=""
          value={member?.foodAllergies || ''}
          onChange={(e) => handleChange('foodAllergies', e.target.value)}
          className="border-border bg-card text-foreground"
        />
      </div>

      {/* Physical Issues */}
      <div className="space-y-4">
        <div className="block font-semibold text-sm">dificultad física?</div>
        <p className="text-secondary-foreground text-xs">
          deja en blanco si no tienes
        </p>
        <Input
          type="text"
          placeholder=""
          value={member?.physicalIssues || ''}
          onChange={(e) => handleChange('physicalIssues', e.target.value)}
          className="border-border bg-card text-foreground"
        />
      </div>

      {/* Sponsor Sharing */}
      <div className="space-y-4">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
            member?.shareWithSponsors
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="checkbox"
            checked={member?.shareWithSponsors || false}
            onChange={(e) =>
              handleChange('shareWithSponsors', e.target.checked)
            }
            className="sr-only"
          />
          <div className="flex-1">
            <div className="font-semibold">compartir info</div>
            <p className="text-secondary-foreground text-sm">
              quiero compartir mi info de contacto con los sponsors principales
              del evento
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
