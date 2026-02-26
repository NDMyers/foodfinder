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
        <div className={`relative flex flex-col gap-1 ${isOpen ? "z-[60]" : "z-10"} ${className}`} ref={containerRef}>
            {label && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink">{label}</span>
            )}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center justify-between w-full border-2 border-ink bg-white rounded-none px-4 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            >
                <span className="text-ink font-bold tracking-tighter uppercase">
                    {selectedOption?.label ?? "Select..."}
                </span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.15, ease: "linear" }}
                    className="w-4 h-4 text-ink"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                >
                    <path
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        d="M19 9l-7 7-7-7"
                    />
                </motion.svg>
            </button>

            {isOpen && (
                <div className="absolute z-[60] w-full top-full mt-1 bg-white border-2 border-ink rounded-none shadow-brutal animate-fade-in">
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-bold tracking-tighter uppercase transition-colors border-b-2 border-ink hover:bg-ink/10 last:border-b-0 ${opt.value === value
                                    ? "bg-ink text-white hover:bg-ink hover:text-white"
                                    : "bg-white text-ink"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
