'use client';

import { useEffect, useState } from 'react';
import type { TrackWithTeams } from '@/src/queries/tracks';
import { CountdownTimer } from './countdown-timer';
import { TrackSelectionGrid } from './track-selection-grid';
import { TracksOverview } from './tracks-overview';

interface TrackSelectionClientProps {
  teamId: string;
  currentTrackId: string | null;
  trackSelectionStartTime: string | null;
  allTeamsSelected: boolean;
  tracksWithTeams: TrackWithTeams[] | null;
}

export default function TrackSelectionClient({
  teamId,
  currentTrackId,
  trackSelectionStartTime: initialStartTime,
  allTeamsSelected: initialAllTeamsSelected,
  tracksWithTeams: initialTracksWithTeams,
}: TrackSelectionClientProps) {
  const [trackSelectionStartTime, setTrackSelectionStartTime] =
    useState<Date | null>(initialStartTime ? new Date(initialStartTime) : null);
  const [trackSelectionStarted, setTrackSelectionStarted] = useState(false);
  const [allTeamsSelected, setAllTeamsSelected] = useState(
    initialAllTeamsSelected,
  );
  const [tracksWithTeams, setTracksWithTeams] = useState<
    TrackWithTeams[] | null
  >(initialTracksWithTeams);

  useEffect(() => {
    if (!trackSelectionStartTime) {
      return;
    }

    const checkIfStarted = () => {
      const now = new Date();
      setTrackSelectionStarted(now >= trackSelectionStartTime);
    };

    checkIfStarted();
    const interval = setInterval(checkIfStarted, 1000);

    return () => clearInterval(interval);
  }, [trackSelectionStartTime]);

  const handleCountdownComplete = () => {
    setTrackSelectionStarted(true);
  };

  const handleTimeChanged = (newTime: Date) => {
    setTrackSelectionStartTime(newTime);
  };

  useEffect(() => {
    if (!trackSelectionStarted || allTeamsSelected) {
      return;
    }

    const checkAllTeamsSelected = async () => {
      try {
        const response = await fetch('/api/tracks/availability');
        if (response.ok) {
          const data = await response.json();
          if (data.allTeamsSelected && data.tracksWithTeams) {
            setAllTeamsSelected(true);
            setTracksWithTeams(data.tracksWithTeams);
          }
        }
      } catch (error) {
        console.error('Error checking if all teams selected:', error);
      }
    };

    checkAllTeamsSelected();
    const interval = setInterval(checkAllTeamsSelected, 3000);

    return () => clearInterval(interval);
  }, [trackSelectionStarted, allTeamsSelected]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Selección de{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Tracks
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Elige el track en el que competirá tu equipo
            </p>
          </div>

          {!trackSelectionStartTime && (
            <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
              <div className="space-y-4">
                <div className="border-primary/20 border-b pb-4">
                  <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                    La selección de tracks no se ha activado aún
                  </h2>
                </div>
                <div className="border-primary border-l-4 pl-4">
                  <p className="font-title text-primary/70 text-sm sm:text-base">
                    El administrador del evento aún no ha configurado el horario
                    de selección de tracks
                  </p>
                </div>
              </div>
            </div>
          )}

          {trackSelectionStartTime && !trackSelectionStarted && (
            <CountdownTimer
              targetTime={trackSelectionStartTime}
              onCountdownComplete={handleCountdownComplete}
              onTimeChanged={handleTimeChanged}
            />
          )}

          {trackSelectionStarted &&
            (allTeamsSelected && tracksWithTeams ? (
              <TracksOverview tracksWithTeams={tracksWithTeams} />
            ) : (
              <TrackSelectionGrid
                teamId={teamId}
                currentTrackId={currentTrackId}
                isLocked={!!currentTrackId}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
