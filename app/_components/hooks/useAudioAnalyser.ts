"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioAnalyserReturn {
  volume: number;
  isActive: boolean;
  start: (stream: MediaStream) => void;
  stop: () => void;
}

export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const [volume, setVolume] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Named function expression: the recursive `tick()` call below binds to
  // this function's own name (a separate scope from the outer `const tick`),
  // which avoids a self-reference-before-declaration lint error while still
  // giving the outer binding a stable identity via useCallback.
  const tick = useCallback(function tick() {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const val = (dataArrayRef.current[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    const normalized = Math.min(1, rms * 3);
    setVolume(normalized);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    setVolume(0);
    setIsActive(false);
  }, []);

  const start = useCallback(
    (stream: MediaStream) => {
      stop();

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(
        new ArrayBuffer(analyser.frequencyBinCount)
      );

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = dataArray;

      setIsActive(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [stop, tick]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { volume, isActive, start, stop };
}
