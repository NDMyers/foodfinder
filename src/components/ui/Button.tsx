"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "emphasis" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-soft hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "bg-white border border-ink-faint text-ink hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed",
  emphasis:
    "bg-accent text-white hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent border border-ink-faint text-ink-soft hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed",
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
