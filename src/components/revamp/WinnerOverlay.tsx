"use client";

import { useMemo } from "react";
import Confetti from "react-confetti";

import type { RestaurantCard } from "@/types/restaurant";

interface WinnerOverlayProps {
  winner: RestaurantCard | null;
  onDismiss: () => void;
}

const getViewportSize = (): { width: number; height: number } => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export default function WinnerOverlay({ winner, onDismiss }: WinnerOverlayProps) {
  const viewport = useMemo(() => getViewportSize(), [winner?.id]);

  if (!winner) {
    return null;
  }

  const onShare = async () => {
    try {
      const shareUrl = winner.mapsUrl;
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Dinner choice: ${winner.name}`,
          text: `Let's go to ${winner.name}!`,
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Ignore share errors to keep the celebration flow uninterrupted.
    }
  };

  return (
    <div className="winner-overlay" role="dialog" aria-modal="true" aria-labelledby="winner-title">
      <Confetti width={viewport.width} height={viewport.height} recycle={false} numberOfPieces={220} gravity={0.2} />

      <div className="winner-card">
        <p className="winner-badge">Winner</p>
        <h2 id="winner-title">{winner.name}</h2>
        <p>{winner.address}</p>

        <div className="winner-actions">
          <a href={winner.mapsUrl} target="_blank" rel="noopener noreferrer" className="tone-primary">
            Open Directions
          </a>
          <button type="button" className="tone-secondary" onClick={onShare}>
            Share
          </button>
          <button type="button" className="tone-ghost" onClick={onDismiss}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
