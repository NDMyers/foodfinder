"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";

import { useSearch } from "@/contexts/SearchContext";
import { CONFETTI_GRAVITY, CONFETTI_PIECES } from "@/lib/constants";
import Button from "@/components/ui/Button";

const getViewportSize = (): { width: number; height: number } => {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
};

export default function WinnerOverlay() {
  const { state, dismissWinner } = useSearch();
  const { winner } = state;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- recalculate on new winner
  const viewport = useMemo(() => getViewportSize(), [winner?.id]);

  const onShare = async () => {
    if (!winner) return;
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
    <AnimatePresence>
      {winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-title"
        >
          <Confetti
            width={viewport.width}
            height={viewport.height}
            recycle={false}
            numberOfPieces={CONFETTI_PIECES}
            gravity={CONFETTI_GRAVITY}
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-ink-faint/30 shadow-elevated p-6"
          >
            <p className="m-0 inline-block rounded-full bg-gold-light text-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Winner
            </p>
            <h2
              id="winner-title"
              className="mt-2 mb-1 text-2xl font-bold tracking-tighter text-ink"
            >
              {winner.name}
            </h2>
            <p className="m-0 mb-4 text-sm text-ink-soft">{winner.address}</p>

            <div className="flex flex-wrap gap-2">
              <a
                href={winner.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary">Open Directions</Button>
              </a>
              <Button variant="secondary" onClick={onShare}>
                Share
              </Button>
              <Button variant="ghost" onClick={dismissWinner}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
