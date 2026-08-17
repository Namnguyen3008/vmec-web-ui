"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AdaptiveStreamingOptions {
  baseSpeedCharsPerFrame?: number;
  punctuationPauseMs?: number;
  onStreamComplete?: () => void;
}

export function useAdaptiveStreaming(
  fullText: string,
  enabled: boolean = true,
  options: AdaptiveStreamingOptions = {}
) {
  const {
    baseSpeedCharsPerFrame = 2,
    punctuationPauseMs = 60,
    onStreamComplete,
  } = options;

  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const fullTextRef = useRef(fullText);
  fullTextRef.current = fullText;

  const onStreamCompleteRef = useRef(onStreamComplete);
  onStreamCompleteRef.current = onStreamComplete;

  const charIndexRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const rafHandleRef = useRef<number | null>(null);

  const finishEarly = useCallback(() => {
    if (rafHandleRef.current) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
    setDisplayedText(fullTextRef.current);
    setIsStreaming(false);
    onStreamCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText("");
      setIsStreaming(false);
      return;
    }

    if (!enabled) {
      setDisplayedText(fullText);
      setIsStreaming(false);
      return;
    }

    // Initialize streaming
    charIndexRef.current = 0;
    pauseUntilRef.current = 0;
    setDisplayedText("");
    setIsStreaming(true);

    let isCancelled = false;

    const tick = (now: number) => {
      if (isCancelled) return;

      const target = fullTextRef.current;
      const currentIdx = charIndexRef.current;
      const remaining = target.length - currentIdx;

      if (remaining <= 0) {
        setDisplayedText(target);
        setIsStreaming(false);
        onStreamCompleteRef.current?.();
        return;
      }

      // Check if paused for punctuation
      if (now < pauseUntilRef.current) {
        rafHandleRef.current = requestAnimationFrame(tick);
        return;
      }

      // Dynamic Adaptive Step Size based on remaining queue buffer
      let stepSize = baseSpeedCharsPerFrame;
      if (remaining > 200) {
        stepSize = 5;
      } else if (remaining > 100) {
        stepSize = 4;
      } else if (remaining > 40) {
        stepSize = 3;
      } else if (remaining > 15) {
        stepSize = 2;
      } else {
        stepSize = 1;
      }

      const nextIdx = Math.min(target.length, currentIdx + stepSize);
      const nextSlice = target.slice(0, nextIdx);
      setDisplayedText(nextSlice);
      charIndexRef.current = nextIdx;

      // Check if last character was punctuation to introduce natural biological micro-pause
      const lastChar = target[nextIdx - 1];
      if (lastChar && [".", ",", ":", "?", "!", "\n"].includes(lastChar)) {
        pauseUntilRef.current = now + (lastChar === "." || lastChar === "\n" ? punctuationPauseMs * 1.5 : punctuationPauseMs);
      }

      rafHandleRef.current = requestAnimationFrame(tick);
    };

    rafHandleRef.current = requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      if (rafHandleRef.current) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
    };
  }, [fullText, enabled, baseSpeedCharsPerFrame, punctuationPauseMs]);

  return {
    displayedText,
    isStreaming,
    finishEarly,
  };
}
