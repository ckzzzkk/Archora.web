'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Types `text` out once after `delayMs`. Screen readers get the whole sentence at once; reduced motion shows it all. */
export default function Typed({ text, delayMs = 0, msPerChar = 22, className = '' }: { text: string; delayMs?: number; msPerChar?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (reduce) {
      setN(text.length);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) clearInterval(timer);
      }, msPerChar);
    }, delayMs);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [text, delayMs, msPerChar, reduce]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, n)}</span>
    </span>
  );
}
