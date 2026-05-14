"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, asChild = false, isLoading, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium border transition-all duration-200 ease-in-out " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35 " +
      "disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary:
        "bg-[var(--color-primary)] text-white border-transparent shadow-md " +
        "hover:brightness-[1.03] hover:shadow-xl hover:scale-[1.01]",
      secondary:
        "bg-muted text-foreground border-border shadow-sm " +
        "hover:bg-muted/70 hover:shadow-md hover:scale-[1.01]",
      outline:
        "bg-transparent text-foreground border-border shadow-sm " +
        "hover:bg-muted/50 hover:shadow-md hover:scale-[1.01]",
      ghost:
        "bg-transparent text-foreground border-transparent " +
        "hover:bg-muted/60",
      danger:
        "bg-red-600 text-white border-transparent shadow-md " +
        "hover:bg-red-700 hover:shadow-xl hover:scale-[1.01]",
    };
    
    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      icon: "h-11 w-11",
    };

    const isDisabled = Boolean(disabled || isLoading);

    if (asChild) {
      return (
        <Slot
          ref={ref as any}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
            <span className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current animate-spin" />
          </span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
