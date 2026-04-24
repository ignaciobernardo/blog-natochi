'use client';
import { useEffect, useRef, useState } from 'react';
import { codes } from './codes';
import TypingCanvas from './TypingCanvas';

export default function CodeTyper() {
  const [code, setCode] = useState('');
  const codeRef = useRef(null);

  useEffect(() => {
    const randomCode = codes[Math.floor(Math.random() * codes.length)];

    setCode(randomCode.code.replace(/\s+/g, ' ').trim());
  }, []);

  return (
    <div className="relative h-full">
      <pre
        ref={codeRef}
        className={`smooth-scroll top-0 left-0 z-10 h-full overflow-y-auto whitespace-pre-wrap bg-transparent text-zinc-800 mix-blend-plus-lighter`}
      >
        <TypingCanvas code={code} speed={0.3} />
      </pre>
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-[15%] bg-gradient-to-t from-zinc-950 to-transparent"></div>
    </div>
  );
}
