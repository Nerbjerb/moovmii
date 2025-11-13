import { useCallback, useRef } from 'react';

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

  const measureAndSync = useCallback(() => {
    if (!containerRef.current || cardRefsMap.current.size === 0) return;

    const allBadges: number[] = [];
    const allDestinations: number[] = [];
    const allSubtitles: number[] = [];
    const allArrivals: number[] = [];

    cardRefsMap.current.forEach((refs) => {
      if (refs.badge) allBadges.push(refs.badge.scrollHeight);
      if (refs.destination) allDestinations.push(refs.destination.scrollHeight);
      if (refs.subtitle) allSubtitles.push(refs.subtitle.scrollHeight);
      if (refs.arrivals) allArrivals.push(refs.arrivals.scrollHeight);
    });

    const maxBadgeHeight = Math.max(...allBadges, 96);
    const maxDestinationHeight = Math.max(...allDestinations, 50);
    const maxSubtitleHeight = Math.max(...allSubtitles, 20);
    const maxArrivalsHeight = Math.max(...allArrivals, 68);

    containerRef.current.style.setProperty('--badge-height', `${maxBadgeHeight}px`);
    containerRef.current.style.setProperty('--destination-block', `${maxDestinationHeight}px`);
    containerRef.current.style.setProperty('--subtitle-block', `${maxSubtitleHeight}px`);
    containerRef.current.style.setProperty('--arrivals-block', `${maxArrivalsHeight}px`);
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

  const registerCard = useCallback((cardId: string) => {
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
        if (el) {
          observeElement(el);
          measureAndSync();
        }
      },
      destinationRef: (el: HTMLDivElement | null) => {
        if (refs.destination) unobserveElement(refs.destination);
        refs.destination = el;
        if (el) {
          observeElement(el);
          measureAndSync();
        }
      },
      subtitleRef: (el: HTMLDivElement | null) => {
        if (refs.subtitle) unobserveElement(refs.subtitle);
        refs.subtitle = el;
        if (el) {
          observeElement(el);
          measureAndSync();
        }
      },
      arrivalsRef: (el: HTMLDivElement | null) => {
        if (refs.arrivals) unobserveElement(refs.arrivals);
        refs.arrivals = el;
        if (el) {
          observeElement(el);
          measureAndSync();
        }
      },
    };
  }, [measureAndSync, observeElement, unobserveElement]);

  return { containerRef, registerCard };
}
