'use client';

import { Calendar, MapPin } from 'lucide-react';

interface EventLocationCardProps {
  eventName: string;
}

export function EventLocationCard({ eventName }: EventLocationCardProps) {
  return (
    <div className="relative overflow-hidden border-2 border-primary bg-background/80 backdrop-blur-sm">
      {/* Background Image with filters */}
      <div className="absolute inset-0 opacity-40">
        <div
          className="h-full w-full bg-center bg-cover"
          style={{
            backgroundImage: 'url(/assets/images/misc/mut.jpg)',
            filter: 'grayscale(100%) contrast(130%) brightness(60%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/30 to-background/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10">
        <div className="space-y-6">
          {/* Title */}
          <div className="border-primary/20 border-b pb-4">
            <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              📍 {eventName}
            </h2>
          </div>

          {/* Date and Time */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-bold font-title text-primary/70 text-sm uppercase">
                  Fecha y Hora
                </h3>
              </div>
              <div className="border-primary border-l-4 pl-4">
                <p className="font-bold font-title text-lg text-primary sm:text-xl">
                  Viernes 21 de Noviembre, 18:30
                </p>
                <p className="font-mono text-primary/70 text-sm">hasta</p>
                <p className="font-bold font-title text-lg text-primary sm:text-xl">
                  Domingo 23 de Noviembre, 15:30
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-bold font-title text-primary/70 text-sm uppercase">
                  Ubicación
                </h3>
              </div>
              <div className="border-primary border-l-4 pl-4">
                <p className="font-bold font-title text-lg text-primary sm:text-xl">
                  MUT (Oficinas de Buk)
                </p>
                <p className="font-mono text-primary/90 text-sm leading-relaxed">
                  Roger de Flor 2725
                  <br />
                  Torre 3, Piso 3
                  <br />
                  Las Condes, Santiago
                </p>
              </div>
            </div>
          </div>

          {/* Map Link */}
          <div className="pt-2">
            <a
              href="https://maps.app.goo.gl/9hCqpWikTLYEx2Jg7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-bold font-title text-background transition-all hover:bg-background hover:text-primary"
            >
              <MapPin className="h-4 w-4" />
              Ver en Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
