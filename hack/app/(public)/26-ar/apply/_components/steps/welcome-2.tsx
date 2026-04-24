'use client';

interface Welcome2Props {
  eventName: string;
}

export function Welcome2({ eventName }: Welcome2Props) {
  return (
    <div className="space-y-8">
      <h1 className="font-bold text-4xl">{eventName}</h1>

      <div className="space-y-6 text-lg text-secondary-foreground">
        <h2 className="font-semibold text-white">hello hacker,</h2>

        <p>naciste muy tarde para descubrir nuevos continentes</p>

        <p>muy temprano para recorrer la galaxia</p>

        <p>
          justo a tiempo para tomar mate y hackear por 36 horas en el mejor
          evento tech de latam
        </p>
      </div>
    </div>
  );
}
