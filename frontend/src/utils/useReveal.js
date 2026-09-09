/**
 * useReveal – Intersection Observer hook for scroll-triggered animations.
 *
 * Call  useRevealAll()  once at the top of any page component.
 * Add  className="reveal"   → fade + slide-up
 *      className="reveal-left"   → fade + slide-from-left
 *      className="reveal-scale"  → fade + scale-up
 *      className="section-heading" → professional letter-spacing entrance
 * Wrap a parent with  className="stagger"  for sequential child delays.
 */

import { useEffect } from 'react';

const SELECTOR = '.reveal, .reveal-left, .reveal-scale, .section-heading';

export function useRevealAll() {
  useEffect(() => {
    const observe = () => {
      const targets = document.querySelectorAll(
        `${SELECTOR}:not(.revealed)`
      );
      if (!targets.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.10, rootMargin: '0px 0px -30px 0px' }
      );

      targets.forEach((el) => observer.observe(el));
      return observer;
    };

    // First pass — elements already in DOM
    let obs = observe();

    // Second pass after a short delay — catches async-loaded content
    const t = setTimeout(() => {
      obs?.disconnect();
      obs = observe();
    }, 350);

    return () => {
      clearTimeout(t);
      obs?.disconnect();
    };
  }, []);
}

export default useRevealAll;
