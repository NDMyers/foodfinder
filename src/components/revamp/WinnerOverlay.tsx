"use client";

import { useMemo, useEffect, useState } from "react";
import Confetti from "react-confetti";

import { useSearch } from "@/contexts/SearchContext";
import { CONFETTI_GRAVITY, CONFETTI_PIECES } from "@/lib/constants";
import Button from "@/components/ui/Button";

const getViewportSize = (): { width: number; height: number } => {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
};

/**
 * Overlay displayed when a winner restaurant is selected.
 * Uses CSS transitions instead of Framer Motion to avoid the opacity:0 stuck-animation bug
 * that occurs when AnimatePresence wraps conditionally rendered components in Next.js StrictMode.
 */
export default function WinnerOverlay() {
  const { state, dismissWinner } = useSearch();
  const { winner } = state;

  // Drive a CSS transition: mount first (opacity 0), then flip to 1 on next tick.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (winner) {
      // Defer to next paint so the initial opacity:0 is committed before transitioning.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [winner]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- recalculate on new winner
  const viewport = useMemo(() => getViewportSize(), [winner?.id]);

  /** Builds a Google Maps Directions URL from user's location to the winner. */
  const directionsUrl = useMemo(() => {
    if (!winner) return "#";
    const dest = `${winner.location.latitude},${winner.location.longitude}`;
    const base = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    if (state.coordinates) {
      const origin = `${state.coordinates.latitude},${state.coordinates.longitude}`;
      return `${base}&origin=${origin}`;
    }
    return base;
  }, [winner, state.coordinates]);

  const onShare = async () => {
    if (!winner) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Dinner choice: ${winner.name}`,
          text: `Let's go to ${winner.name}!`,
          url: directionsUrl,
        });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(directionsUrl);
      }
    } catch {
      // Ignore share errors to keep the celebration flow uninterrupted.
    }
  };

  if (!winner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
    >
      <Confetti
        width={viewport.width}
        height={viewport.height}
        recycle={false}
        numberOfPieces={CONFETTI_PIECES}
        gravity={CONFETTI_GRAVITY}
        colors={['#FFB5E8', '#B5EAD7', '#C7CEEA', '#FF9CEE', '#FDFDBD']}
      />

      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.25s ease, transform 0.2s ease-out",
        }}
        className="relative w-full max-w-md bg-[#FFB5E8] border-4 border-black shadow-[8px_8px_0_0_#000] p-8 rounded-none overflow-hidden"
      >
        <div className="relative flex flex-col items-start gap-4">
          <p className="m-0 inline-block bg-white text-black border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest">
            Winner
          </p>

          <div className="w-full">
            <h2
              id="winner-title"
              className="m-0 text-5xl font-black uppercase tracking-tighter text-black leading-none break-words"
            >
              {winner.name}
            </h2>
          </div>

          <p className="m-0 text-lg text-black font-bold border-t-2 border-black pt-4 w-full">
            {winner.address}
          </p>

          <div className="flex flex-col w-full gap-3 mt-4">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="primary" className="w-full justify-between items-center bg-black text-white hover:bg-black/90">
                <span>Get Directions</span>
                <span className="text-xl leading-none translate-y-[-2px]">↗</span>
              </Button>
            </a>
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={onShare} className="flex-1 bg-[#B5EAD7] border-2 border-black text-black hover:bg-[#8adeb4]">
                Share
              </Button>
              <Button variant="secondary" onClick={dismissWinner} className="flex-1 bg-white border-2 border-black text-black hover:bg-gray-100">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
