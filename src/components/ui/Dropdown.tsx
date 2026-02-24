"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface DropdownOption<T extends string | number> {
    label: string;
    value: T;
}

interface DropdownProps<T extends string | number> {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    label?: string;
    className?: string;
}

export default function Dropdown<T extends string | number>({
    value,
    options,
    onChange,
    label,
    className = "",
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative flex flex-col gap-1 ${className}`} ref={containerRef}>
            {label && (
                <span className="text-xs text-ink-soft tracking-wide">{label}</span>
            )}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center justify-between w-full border border-glass-border/40 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2.5 text-sm min-h-[44px] hover:bg-white/80 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
                <span className="text-ink font-medium">
                    {selectedOption?.label ?? "Select..."}
                </span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-4 h-4 text-ink-soft"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </motion.svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute z-50 w-full top-full mt-2 bg-white/80 backdrop-blur-xl border border-glass-border shadow-glass rounded-xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                            {options.map((opt) => (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-black/5 ${opt.value === value
                                            ? "bg-accent/10 text-accent-dark font-semibold"
                                            : "text-ink"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
