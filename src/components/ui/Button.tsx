"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "emphasis" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-white border-2 border-ink text-ink disabled:opacity-50 disabled:cursor-not-allowed",
  emphasis:
    "bg-accent text-white border-2 border-accent disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-ink border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
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
        whileHover={disabled ? undefined : { scale: 1.0 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "tween", duration: 0.1 }}
        className={`inline-flex items-center justify-center px-4 py-3 text-sm font-bold tracking-tighter uppercase cursor-pointer min-h-[44px] rounded-none ${variantClasses[variant]} ${className}`}
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
