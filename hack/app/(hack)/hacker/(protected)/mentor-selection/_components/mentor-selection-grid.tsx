'use client';

import { Check, Users } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { MentorAvailability } from '@/app/api/mentors/availability/route';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { selectMentorAction } from '../_actions/select-mentor.action';

interface MentorSelectionGridProps {
  teamId: string;
  currentMentorId: string | null;
  isLocked: boolean;
}

export function MentorSelectionGrid({
  teamId,
  currentMentorId,
  isLocked,
}: MentorSelectionGridProps) {
  const [mentors, setMentors] = useState<MentorAvailability[]>([]);
  const [teamsWithoutMentor, setTeamsWithoutMentor] = useState<number>(0);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(
    currentMentorId,
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('/api/mentors/availability');
        if (response.ok) {
          const data = await response.json();
          // Sort mentors alphabetically by fullName (case-insensitive, by first letter)
          const sortedMentors = [...data.mentors].sort((a, b) =>
            a.fullName.localeCompare(b.fullName, undefined, {
              sensitivity: 'base',
            }),
          );
          setMentors(sortedMentors);
          setTeamsWithoutMentor(data.teamsWithoutMentor || 0);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setError('Failed to load mentors');
        setIsLoading(false);
      }
    };

    fetchMentors();

    const interval = setInterval(fetchMentors, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectMentor = async (mentorId: string) => {
    if (isLocked) {
      setError(
        'Your team has already selected a mentor and it cannot be changed',
      );
      return;
    }

    setIsPending(true);
    setError(null);
    setSuccess(null);

    const result = await selectMentorAction({ teamId, mentorId });

    if (result.success) {
      setSelectedMentorId(mentorId);
      setSuccess('¡Mentor seleccionado exitosamente!');
    } else {
      setError(result.globalError || 'Failed to select mentor');
    }

    setIsPending(false);
  };

  if (isLoading) {
    return (
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="border-primary border-l-4 pl-4">
          <p className="font-title text-primary/70 text-sm sm:text-base">
            Cargando mentores disponibles...
          </p>
        </div>
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="space-y-4">
          <div className="border-primary/20 border-b pb-4">
            <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              No hay mentores disponibles
            </h2>
          </div>
          <div className="border-primary border-l-4 pl-4">
            <p className="font-title text-primary/70 text-sm sm:text-base">
              No hay mentores disponibles para selección en este momento
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-2 border-red-500 bg-red-50/80 p-4 backdrop-blur-sm">
          <div className="border-red-500 border-l-4 pl-4">
            <p className="font-title text-red-600 text-sm sm:text-base">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="border-2 border-green-500 bg-green-50/80 p-4 backdrop-blur-sm">
          <div className="border-green-500 border-l-4 pl-4">
            <p className="font-title text-green-600 text-sm sm:text-base">
              {success}
            </p>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
          <div className="border-primary border-l-4 pl-4">
            <p className="font-bold font-title text-lg text-primary sm:text-xl">
              Tu equipo ya seleccionó un mentor y no puede ser cambiado
            </p>
          </div>
        </div>
      )}

      {teamsWithoutMentor > 0 && (
        <div className="border-2 border-primary bg-background/80 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <p className="font-title text-primary text-sm sm:text-base">
              <span className="font-bold">{teamsWithoutMentor}</span>{' '}
              {teamsWithoutMentor === 1
                ? 'equipo sin mentor'
                : 'equipos sin mentor'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {mentors.map((mentor) => {
          const isSelected = selectedMentorId === mentor.id;
          const isFull =
            mentor.availableSpots !== null && mentor.availableSpots <= 0;
          const isDisabled = isPending || isLocked || isFull;

          return (
            <div
              key={mentor.id}
              className={`border-2 bg-background/80 p-6 backdrop-blur-sm transition-all sm:p-8 ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-primary/50'} ${isFull ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-start gap-4">
                  {mentor.pictureUrl && (
                    <div className="shrink-0">
                      <Image
                        src={mentor.pictureUrl}
                        alt={mentor.fullName}
                        width={80}
                        height={80}
                        className="rounded-lg border-2 border-primary/20 object-cover grayscale"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold font-title text-primary text-xl sm:text-2xl">
                          {mentor.fullName}
                        </h3>
                        {mentor.companyTitle && (
                          <p className="mt-1 font-title text-primary/70 text-sm sm:text-base">
                            {mentor.companyTitle}
                          </p>
                        )}
                        {mentor.github && (
                          <p className="mt-1 font-title text-primary/60 text-xs sm:text-sm">
                            {mentor.github.replace(
                              /^https?:\/\/(www\.)?github\.com\//,
                              '',
                            )}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="rounded-full bg-primary p-1">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-primary border-l-4 pl-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary/70" />
                        {mentor.totalSpots !== null &&
                        mentor.availableSpots !== null ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isFull ? 'destructive' : 'secondary'}
                              className="font-mono"
                            >
                              {mentor.availableSpots}/{mentor.totalSpots}
                            </Badge>
                            <span className="font-title text-primary/70 text-sm">
                              {isFull ? 'Cupos llenos' : 'cupos disponibles'}
                            </span>
                          </div>
                        ) : (
                          <span className="font-title text-primary/70 text-sm">
                            {mentor.currentTeams}{' '}
                            {mentor.currentTeams === 1 ? 'equipo' : 'equipos'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSelectMentor(mentor.id)}
                  disabled={isDisabled}
                  className="shrink-0"
                  variant={isSelected ? 'secondary' : 'default'}
                >
                  {isFull && !isSelected
                    ? 'Mentor lleno'
                    : isSelected
                      ? 'Seleccionado'
                      : 'Seleccionar mentor'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
