'use client';

import { useEffect, useRef } from 'react';

export function useDeploymentRefresh(intervalMs = 5000) {
  const initialHashRef = useRef<string | null>(null);

  useEffect(() => {
    const checkDeployment = async () => {
      try {
        const response = await fetch('/api/deployment-hash', {
          cache: 'no-store',
        });
        const data = await response.json();
        const currentHash = data.hash;

        if (initialHashRef.current === null) {
          initialHashRef.current = currentHash;
        } else if (initialHashRef.current !== currentHash) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to check deployment hash:', error);
      }
    };

    checkDeployment();

    const intervalId = setInterval(checkDeployment, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);
}
