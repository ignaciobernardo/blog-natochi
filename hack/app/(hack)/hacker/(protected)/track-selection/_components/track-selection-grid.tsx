'use client';

import { Check, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TrackAvailability } from '@/app/api/tracks/availability/route';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { selectTrackAction } from '../_actions/select-track.action';

interface TrackSelectionGridProps {
  teamId: string;
  currentTrackId: string | null;
  isLocked: boolean;
}

export function TrackSelectionGrid({
  teamId,
  currentTrackId,
  isLocked,
}: TrackSelectionGridProps) {
  const [tracks, setTracks] = useState<TrackAvailability[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    currentTrackId,
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch('/api/tracks/availability');
        if (response.ok) {
          const data = await response.json();
          setTracks(data.tracks);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError('Failed to load tracks');
        setIsLoading(false);
      }
    };

    fetchTracks();

    const interval = setInterval(fetchTracks, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectTrack = async (trackId: string) => {
    if (isLocked) {
      setError(
        'Your team has already selected a track and it cannot be changed',
      );
      return;
    }

    setIsPending(true);
    setError(null);
    setSuccess(null);

    const result = await selectTrackAction({ teamId, trackId });

    if (result.success) {
      setSelectedTrackId(trackId);
      setSuccess('¡Track seleccionado exitosamente!');
    } else {
      setError(result.globalError || 'Failed to select track');
    }

    setIsPending(false);
  };

  if (isLoading) {
    return (
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="border-primary border-l-4 pl-4">
          <p className="font-title text-primary/70 text-sm sm:text-base">
            Cargando tracks disponibles...
          </p>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="space-y-4">
          <div className="border-primary/20 border-b pb-4">
            <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              No hay tracks disponibles
            </h2>
          </div>
          <div className="border-primary border-l-4 pl-4">
            <p className="font-title text-primary/70 text-sm sm:text-base">
              No hay tracks disponibles para selección en este momento
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
              Tu equipo ya seleccionó un track y no puede ser cambiado
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track) => {
          const isSelected = selectedTrackId === track.id;
          const isFull =
            track.availableSpots !== null && track.availableSpots <= 0;
          const isDisabled = isPending || isLocked || isFull;

          return (
            <div
              key={track.id}
              className={`border-2 bg-background/80 p-6 backdrop-blur-sm transition-all sm:p-8 ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-primary/50'} ${isFull ? 'opacity-60' : ''}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold font-title text-primary text-xl sm:text-2xl">
                      {track.name}
                    </h3>
                    {track.description && (
                      <p className="mt-2 font-title text-primary/70 text-sm sm:text-base">
                        {track.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div className="border-primary border-l-4 pl-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary/70" />
                    {track.totalSpots !== null &&
                    track.availableSpots !== null ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isFull ? 'destructive' : 'secondary'}
                          className="font-mono"
                        >
                          {track.availableSpots}/{track.totalSpots}
                        </Badge>
                        <span className="font-title text-primary/70 text-sm">
                          {isFull ? 'Cupos llenos' : 'cupos disponibles'}
                        </span>
                      </div>
                    ) : (
                      <span className="font-title text-primary/70 text-sm">
                        {track.currentTeams}{' '}
                        {track.currentTeams === 1 ? 'equipo' : 'equipos'}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleSelectTrack(track.id)}
                  disabled={isDisabled}
                  className="w-full"
                  variant={isSelected ? 'secondary' : 'default'}
                >
                  {isFull && !isSelected
                    ? 'Track lleno'
                    : isSelected
                      ? 'Seleccionado'
                      : 'Seleccionar track'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
