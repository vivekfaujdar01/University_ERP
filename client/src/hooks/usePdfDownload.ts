/**
 * usePdfDownload — downloads a PDF from a protected API endpoint.
 *
 * The endpoint requires a Bearer token which window.open() cannot send.
 * This hook uses fetch() with the Authorization header, converts the
 * response to a Blob, then triggers a browser download via a temporary
 * object URL — no window.open() needed.
 */
import { useState } from 'react';
import { useAppSelector } from './useAppDispatch';
import { selectAccessToken } from '@/features/authSlice';
import { toast } from 'sonner';

export function usePdfDownload() {
  const [downloading, setDownloading] = useState(false);
  const token = useAppSelector(selectAccessToken);

  const download = async (url: string, filename: string) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Release the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) || 'PDF download failed'
      );
    } finally {
      setDownloading(false);
    }
  };

  return { download, downloading };
}
