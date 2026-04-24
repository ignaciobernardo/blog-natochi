'use client';

import { useEffect, useState } from 'react';
import type { MentorWithTeams } from '@/src/queries/mentors';
import { CountdownTimer } from './countdown-timer';
import { MentorSelectionGrid } from './mentor-selection-grid';
import { MentorsOverview } from './mentors-overview';

interface MentorSelectionClientProps {
  teamId: string;
  currentMentorId: string | null;
  mentorSelectionStartTime: string | null;
  allTeamsSelected: boolean;
  mentorsWithTeams: MentorWithTeams[] | null;
}

export default function MentorSelectionClient({
  teamId,
  currentMentorId,
  mentorSelectionStartTime: initialStartTime,
  allTeamsSelected: initialAllTeamsSelected,
  mentorsWithTeams: initialMentorsWithTeams,
}: MentorSelectionClientProps) {
  const [mentorSelectionStartTime, setMentorSelectionStartTime] =
    useState<Date | null>(initialStartTime ? new Date(initialStartTime) : null);
  const [mentorSelectionStarted, setMentorSelectionStarted] = useState(false);
  const [allTeamsSelected, setAllTeamsSelected] = useState(
    initialAllTeamsSelected,
  );
  const [mentorsWithTeams, setMentorsWithTeams] = useState<
    MentorWithTeams[] | null
  >(initialMentorsWithTeams);

  useEffect(() => {
    if (!mentorSelectionStartTime) {
      return;
    }

    const checkIfStarted = () => {
      const now = new Date();
      setMentorSelectionStarted(now >= mentorSelectionStartTime);
    };

    checkIfStarted();
    const interval = setInterval(checkIfStarted, 1000);

    return () => clearInterval(interval);
  }, [mentorSelectionStartTime]);

  const handleCountdownComplete = () => {
    setMentorSelectionStarted(true);
  };

  const handleTimeChanged = (newTime: Date) => {
    setMentorSelectionStartTime(newTime);
  };

  useEffect(() => {
    if (!mentorSelectionStarted || allTeamsSelected) {
      return;
    }

    const checkAllTeamsSelected = async () => {
      try {
        const response = await fetch('/api/mentors/availability');
        if (response.ok) {
          const data = await response.json();
          if (data.allTeamsSelected && data.mentorsWithTeams) {
            setAllTeamsSelected(true);
            setMentorsWithTeams(data.mentorsWithTeams);
          }
        }
      } catch (error) {
        console.error('Error checking if all teams selected:', error);
      }
    };

    checkAllTeamsSelected();
    const interval = setInterval(checkAllTeamsSelected, 3000);

    return () => clearInterval(interval);
  }, [mentorSelectionStarted, allTeamsSelected]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Selección de{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Mentores
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Elige el mentor que acompañará a tu equipo
            </p>
          </div>

          {!mentorSelectionStartTime && (
            <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
              <div className="space-y-4">
                <div className="border-primary/20 border-b pb-4">
                  <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                    La selección de mentores no se ha activado aún
                  </h2>
                </div>
                <div className="border-primary border-l-4 pl-4">
                  <p className="font-title text-primary/70 text-sm sm:text-base">
                    El administrador del evento aún no ha configurado el horario
                    de selección de mentores
                  </p>
                </div>
              </div>
            </div>
          )}

          {mentorSelectionStartTime && !mentorSelectionStarted && (
            <CountdownTimer
              targetTime={mentorSelectionStartTime}
              onCountdownComplete={handleCountdownComplete}
              onTimeChanged={handleTimeChanged}
            />
          )}

          {mentorSelectionStarted &&
            (allTeamsSelected && mentorsWithTeams ? (
              <MentorsOverview mentorsWithTeams={mentorsWithTeams} />
            ) : (
              <MentorSelectionGrid
                teamId={teamId}
                currentMentorId={currentMentorId}
                isLocked={!!currentMentorId}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
