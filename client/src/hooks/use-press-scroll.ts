import { useRef, useEffect, useCallback, useState } from "react";

interface UsePressScrollOptions {
  activationDelay?: number;
  moveThreshold?: number;
  scrollMultiplier?: number;
  clickBlockDuration?: number;
}

export function usePressScroll(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UsePressScrollOptions = {}
) {
  const {
    activationDelay = 300,
    moveThreshold = 5,
    scrollMultiplier = 1.5,
    clickBlockDuration = 100,
  } = options;

  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const wasScrollingRef = useRef(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const activateScrollMode = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    isScrollingRef.current = true;
    wasScrollingRef.current = true;
    setIsScrolling(true);
    container.style.cursor = "grabbing";
    container.dataset.scrollActive = "true";
  }, [containerRef]);

  const deactivateScrollMode = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const wasActive = isScrollingRef.current;
    isScrollingRef.current = false;
    setIsScrolling(false);
    container.style.cursor = "";
    delete container.dataset.scrollActive;
    pointerIdRef.current = null;
    
    if (wasActive) {
      if (clickBlockTimerRef.current) {
        clearTimeout(clickBlockTimerRef.current);
      }
      clickBlockTimerRef.current = setTimeout(() => {
        wasScrollingRef.current = false;
      }, clickBlockDuration);
    } else {
      wasScrollingRef.current = false;
    }
  }, [containerRef, clickBlockDuration]);

  const shouldBlockClick = useCallback(() => {
    return wasScrollingRef.current;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e: PointerEvent) => {
      startYRef.current = e.clientY;
      startXRef.current = e.clientX;
      startScrollTopRef.current = container.scrollTop;
      pointerIdRef.current = e.pointerId;

      clearPressTimer();

      pressTimerRef.current = setTimeout(() => {
        activateScrollMode();
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
        }
      }, activationDelay);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - startYRef.current;
      const deltaX = e.clientX - startXRef.current;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!isScrollingRef.current && distance > moveThreshold) {
        clearPressTimer();
        return;
      }

      if (isScrollingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        
        const scrollDelta = deltaY * scrollMultiplier;
        const newScrollTop = startScrollTopRef.current - scrollDelta;
        
        container.scrollTop = Math.max(
          0,
          Math.min(newScrollTop, container.scrollHeight - container.clientHeight)
        );
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      clearPressTimer();
      
      if (isScrollingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {
        }
      }
      
      deactivateScrollMode();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      handlePointerUp(e);
    };

    const handleContextMenu = (e: Event) => {
      if (isScrollingRef.current) {
        e.preventDefault();
      }
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerCancel);
    container.addEventListener("contextmenu", handleContextMenu);

    return () => {
      clearPressTimer();
      if (clickBlockTimerRef.current) {
        clearTimeout(clickBlockTimerRef.current);
      }
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerCancel);
      container.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [containerRef, activationDelay, moveThreshold, scrollMultiplier, clearPressTimer, activateScrollMode, deactivateScrollMode]);

  return { isScrolling, shouldBlockClick };
}
