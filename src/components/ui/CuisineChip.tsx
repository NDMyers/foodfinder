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
      whileHover={{ scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center border-2 px-3 py-1 cursor-pointer text-sm font-bold uppercase tracking-tight min-h-[40px] rounded-none ${active
        ? "border-primary bg-primary text-white"
        : "border-ink bg-white text-ink"
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
