/**
 * Lightweight IntersectionObserver hook — replaces framer-motion's
 * `whileInView` for scroll-triggered animations.  Observer disconnects
 * after first intersection (one-shot), matching `viewport={{ once: true }}`.
 *
 * Usage:
 *   const [ref, isInView] = useInView({ threshold: 0.1 });
 *   <div ref={ref} className={isInView ? 'animate-fade-in-up' : 'opacity-0'}>
 */
import { useRef, useState, useEffect } from 'react';

export default function useInView({ threshold = 0.1, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, isInView]);

  return [ref, isInView];
}
