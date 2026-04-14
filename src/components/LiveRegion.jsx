import { useState, useEffect } from 'react';
import { processQueue, cleanupAnnounce } from '../utils/announce';

export function LiveRegion() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    processQueue(setMessage);
    return cleanupAnnounce;
  }, []);

  if (!message) return null;

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}