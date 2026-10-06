import { useEffect } from 'react';

export function useTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · NPTEL Practice` : 'NPTEL Practice';
  }, [title]);
}
