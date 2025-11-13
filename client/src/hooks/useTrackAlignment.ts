import { useCallback, useRef, useMemo, useEffect } from 'react';

interface TrackElementRefs {
  badge: HTMLDivElement | null;
  destination: HTMLDivElement | null;
  subtitle: HTMLDivElement | null;
  arrivals: HTMLDivElement | null;
}

interface TrackAlignmentHook {
  containerRef: React.RefObject<HTMLDivElement>;
  registerCard: (cardId: string) => {
    badgeRef: (el: HTMLDivElement | null) => void;
    destinationRef: (el: HTMLDivElement | null) => void;
    subtitleRef: (el: HTMLDivElement | null) => void;
    arrivalsRef: (el: HTMLDivElement | null) => void;
  };
}

export function useTrackAlignment(): TrackAlignmentHook {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefsMap = useRef<Map<string, TrackElementRefs>>(new Map());
  const observersMap = useRef<Map<HTMLDivElement, ResizeObserver>>(new Map());
  const rafId = useRef<number | null>(null);
  const measurementPending = useRef(false);
  
  // Current CSS variable values to detect changes
  const currentHeights = useRef({
    badge: 96,
    destination: 110,
    subtitle: 20,
    arrivals: 68,
  });

  const measureAndSync = useCallback(() => {
    if (measurementPending.current || rafId.current !== null) return;
    
    measurementPending.current = true;
    rafId.current = requestAnimationFrame(() => {
      measurementPending.current = false;
      rafId.current = null;
      
      if (!containerRef.current || cardRefsMap.current.size === 0) return;
      
      const allBadges: number[] = [];
      const allDestinations: number[] = [];
      const allSubtitles: number[] = [];
      const allArrivals: number[] = [];

      cardRefsMap.current.forEach((refs) => {
        if (refs.badge) allBadges.push(refs.badge.offsetHeight);
        if (refs.destination) allDestinations.push(refs.destination.offsetHeight);
        if (refs.subtitle) allSubtitles.push(refs.subtitle.offsetHeight);
        if (refs.arrivals) allArrivals.push(refs.arrivals.offsetHeight);
      });

      const maxBadgeHeight = Math.max(...allBadges, 96);
      const maxDestinationHeight = Math.max(...allDestinations, 110);
      const maxSubtitleHeight = Math.max(...allSubtitles, 20);
      const maxArrivalsHeight = Math.max(...allArrivals, 68);

      // Only update CSS custom properties if values have changed
      if (
        maxBadgeHeight !== currentHeights.current.badge ||
        maxDestinationHeight !== currentHeights.current.destination ||
        maxSubtitleHeight !== currentHeights.current.subtitle ||
        maxArrivalsHeight !== currentHeights.current.arrivals
      ) {
        currentHeights.current = {
          badge: maxBadgeHeight,
          destination: maxDestinationHeight,
          subtitle: maxSubtitleHeight,
          arrivals: maxArrivalsHeight,
        };
        
        // Write directly to DOM via CSS custom properties (no React state)
        containerRef.current.style.setProperty('--track-badge-height', `${maxBadgeHeight}px`);
        containerRef.current.style.setProperty('--track-destination-height', `${maxDestinationHeight}px`);
        containerRef.current.style.setProperty('--track-subtitle-height', `${maxSubtitleHeight}px`);
        containerRef.current.style.setProperty('--track-arrivals-height', `${maxArrivalsHeight}px`);
      }
    });
  }, []);

  const observeElement = useCallback((el: HTMLDivElement) => {
    if (observersMap.current.has(el)) return;

    const observer = new ResizeObserver(() => {
      measureAndSync();
    });
    
    observer.observe(el);
    observersMap.current.set(el, observer);
  }, [measureAndSync]);

  const unobserveElement = useCallback((el: HTMLDivElement) => {
    const observer = observersMap.current.get(el);
    if (observer) {
      observer.disconnect();
      observersMap.current.delete(el);
    }
  }, []);
  
  // Stable registerCard function using useMemo to maintain hook order
  const registerCard = useMemo(() => {
    return (cardId: string) => {
      if (!cardRefsMap.current.has(cardId)) {
        cardRefsMap.current.set(cardId, {
          badge: null,
          destination: null,
          subtitle: null,
          arrivals: null,
        });
      }

      const refs = cardRefsMap.current.get(cardId)!;

      return {
        badgeRef: (el: HTMLDivElement | null) => {
          if (refs.badge) unobserveElement(refs.badge);
          refs.badge = el;
          if (el) observeElement(el);
        },
        destinationRef: (el: HTMLDivElement | null) => {
          if (refs.destination) unobserveElement(refs.destination);
          refs.destination = el;
          if (el) observeElement(el);
        },
        subtitleRef: (el: HTMLDivElement | null) => {
          if (refs.subtitle) unobserveElement(refs.subtitle);
          refs.subtitle = el;
          if (el) observeElement(el);
        },
        arrivalsRef: (el: HTMLDivElement | null) => {
          if (refs.arrivals) unobserveElement(refs.arrivals);
          refs.arrivals = el;
          if (el) observeElement(el);
        },
      };
    };
  }, [observeElement, unobserveElement]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      observersMap.current.forEach(observer => observer.disconnect());
      observersMap.current.clear();
    };
  }, []);

  return { containerRef, registerCard };
}
