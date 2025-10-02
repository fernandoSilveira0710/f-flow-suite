import { useEffect, useRef, useState, useCallback } from 'react';

interface BarcodeScannerOptions {
  onScan: (code: string) => void;
  minLength?: number;
  scanInterval?: number; // time between keystrokes to consider it a scanner (ms)
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minLength = 3,
  scanInterval = 30,
  enabled = true,
}: BarcodeScannerOptions) {
  const [buffer, setBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeystrokeRef = useRef<number>(0);

  const clearBuffer = useCallback(() => {
    setBuffer('');
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if in input/textarea
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeystrokeRef.current;
      lastKeystrokeRef.current = now;

      // If Enter key, process buffer
      if (event.key === 'Enter') {
        if (buffer.length >= minLength) {
          event.preventDefault();
          onScan(buffer.trim());
          clearBuffer();
        }
        return;
      }

      // If rapid typing (likely scanner), build buffer
      if (timeSinceLastKey < scanInterval) {
        setIsScanning(true);
        setBuffer((prev) => prev + event.key);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(clearBuffer, scanInterval * 3);
      } else {
        // Normal typing, reset buffer
        setBuffer(event.key);
        setIsScanning(false);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer, enabled, minLength, scanInterval, onScan, clearBuffer]);

  return { buffer, isScanning, clearBuffer };
}
