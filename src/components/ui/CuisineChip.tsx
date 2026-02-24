"use client";

import { motion } from "framer-motion";

interface CuisineChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export default function CuisineChip({ label, active, onToggle }: CuisineChipProps) {
  return (
    <motion.label
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center rounded-full border px-4 py-2 cursor-pointer text-sm font-medium min-h-[44px] transition-all duration-300 ${active
          ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
          : "border-glass-border/40 bg-white/40 backdrop-blur-md text-ink hover:bg-white/70"
        }`}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={onToggle}
        className="absolute opacity-0 pointer-events-none"
      />
      <span>{label}</span>
    </motion.label>
  );
}
