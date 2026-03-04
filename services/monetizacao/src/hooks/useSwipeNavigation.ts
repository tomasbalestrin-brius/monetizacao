import { useState, useCallback, useRef } from 'react';

interface UseSwipeNavigationOptions<T extends { id: string }> {
  items: T[];
  currentId: string;
  onNavigate: (id: string) => void;
  threshold?: number;
}

interface UseSwipeNavigationReturn {
  currentIndex: number;
  totalItems: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  goNext: () => void;
  goPrev: () => void;
  swipeOffset: number;
  isSwiping: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useSwipeNavigation<T extends { id: string }>({
  items,
  currentId,
  onNavigate,
  threshold = 50,
}: UseSwipeNavigationOptions<T>): UseSwipeNavigationReturn {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const currentIndex = items.findIndex((item) => item.id === currentId);
  const canGoNext = currentIndex < items.length - 1;
  const canGoPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (canGoNext) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onNavigate(items[currentIndex + 1].id);
    }
  }, [canGoNext, currentIndex, items, onNavigate]);

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onNavigate(items[currentIndex - 1].id);
    }
  }, [canGoPrev, currentIndex, items, onNavigate]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;
    
    // Determine if this is a horizontal or vertical swipe on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }
    
    // Only track horizontal swipes
    if (isHorizontalSwipe.current) {
      // Apply resistance if trying to swipe past boundaries
      let offset = diffX;
      if ((diffX > 0 && !canGoPrev) || (diffX < 0 && !canGoNext)) {
        offset = diffX * 0.3; // Resistance
      }
      setSwipeOffset(offset);
    }
  }, [isSwiping, canGoNext, canGoPrev]);

  const onTouchEnd = useCallback(() => {
    if (!isSwiping) return;
    
    if (isHorizontalSwipe.current) {
      if (swipeOffset < -threshold && canGoNext) {
        goNext();
      } else if (swipeOffset > threshold && canGoPrev) {
        goPrev();
      }
    }
    
    setSwipeOffset(0);
    setIsSwiping(false);
    isHorizontalSwipe.current = null;
  }, [isSwiping, swipeOffset, threshold, canGoNext, canGoPrev, goNext, goPrev]);

  return {
    currentIndex,
    totalItems: items.length,
    canGoNext,
    canGoPrev,
    goNext,
    goPrev,
    swipeOffset,
    isSwiping,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
