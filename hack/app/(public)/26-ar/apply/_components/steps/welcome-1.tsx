'use client';

interface Welcome1Props {
  eventName: string;
}

export function Welcome1({ eventName }: Welcome1Props) {
  return (
    <div className="space-y-8">
      <h1 className="font-bold text-4xl">{eventName}</h1>

      <div className="space-y-6 text-gray-300 text-lg">
        <div>
          <h2 className="mb-2 font-semibold text-white">
            welcome again, hacker
          </h2>
        </div>

        <p>tenemos herramientas que hace 3 años ni soñabamos</p>

        <p>
          la capacidad de construir con tecnología se{' '}
          <span className="text-white">disparó</span>, y no sabemos a donde
          llegaremos
        </p>

        <p>
          ni siquiera estamos seguros de que somos capaces de construir{' '}
          <span className="text-white">hoy</span>, y queremos averiguarlo
        </p>
      </div>
    </div>
  );
}
