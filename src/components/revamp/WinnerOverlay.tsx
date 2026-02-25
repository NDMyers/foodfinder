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
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-md p-4"
    >
      <Confetti
        width={viewport.width}
        height={viewport.height}
        recycle={false}
        numberOfPieces={CONFETTI_PIECES}
        gravity={CONFETTI_GRAVITY}
      />

      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(60px) scale(0.92)",
          transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        className="relative w-full max-w-md rounded-[2rem] bg-white/70 backdrop-blur-3xl border border-glass-border shadow-glass p-8 overflow-hidden"
      >
        {/* Ambient glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <p className="m-0 inline-block rounded-full bg-gradient-to-r from-gold to-[#fcd34d] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
            Winner
          </p>
          <h2
            id="winner-title"
            className="mt-4 mb-1 text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-ink to-ink-soft leading-tight"
          >
            {winner.name}
          </h2>
          <p className="m-0 mb-6 text-sm text-ink-soft font-medium">{winner.address}</p>

          <div className="flex flex-wrap gap-3">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary">Get Directions</Button>
            </a>
            <Button variant="secondary" onClick={onShare}>
              Share
            </Button>
            <Button variant="ghost" onClick={dismissWinner}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
