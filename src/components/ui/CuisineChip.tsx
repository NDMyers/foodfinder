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
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center rounded-full border px-3 py-2 cursor-pointer text-sm min-h-[44px] transition-colors ${
        active
          ? "border-primary bg-primary-light text-primary-dark"
          : "border-ink-faint bg-white text-ink-soft hover:bg-gray-50"
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
