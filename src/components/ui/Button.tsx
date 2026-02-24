"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "emphasis" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-primary-light text-white shadow-soft hover:shadow-elevated hover:from-primary-dark hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-white/60 backdrop-blur-md border border-glass-border/50 text-ink shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed",
  emphasis:
    "bg-gradient-to-tr from-accent-dark to-accent text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-ink-soft hover:bg-black/5 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium tracking-tight cursor-pointer transition-colors min-h-[44px] ${variantClasses[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
