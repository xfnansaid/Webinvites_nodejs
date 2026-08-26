/**
 * Lightweight fade-in wrapper — replaces framer-motion's `motion.div` with
 * `whileInView`.  Uses a single IntersectionObserver per instance and
 * disconnects after first intersection (one-shot, like `viewport={{ once: true }}`).
 *
 * Usage:
 *   <FadeIn className="..." delay={0.15}>
 *     <h2>Title</h2>
 *   </FadeIn>
 */
'use client';

import { useRef, useState, useEffect } from 'react';

export default function FadeIn({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  threshold = 0.1,
  rootMargin = '0px',
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold, rootMargin]);

  return (
    <Tag
      ref={ref}
      className={`${className} ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}s` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
