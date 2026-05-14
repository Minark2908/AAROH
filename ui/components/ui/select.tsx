"use client";

import React, { Children, isValidElement, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SelectRootProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
};

type SelectTriggerProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

type SelectValueProps = {
  placeholder?: string;
};

type SelectContentProps = {
  children?: ReactNode;
};

type SelectItemProps = {
  value: string;
  children: ReactNode;
};

function walk(node: ReactNode, visit: (el: ReactElement) => void) {
  Children.forEach(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;
    visit(child);
    if (child.props?.children) walk(child.props.children, visit);
  });
}

export function Select({ value, onValueChange, children }: SelectRootProps) {
  let triggerClassName: string | undefined;
  let placeholder: string | undefined;
  const items: Array<{ value: string; label: string }> = [];

  walk(children, (el) => {
    if (el.type === SelectTrigger) {
      triggerClassName = (el.props as { className?: string } | undefined)?.className;
    }
    if (el.type === SelectValue) {
      placeholder = (el.props as { placeholder?: string } | undefined)?.placeholder;
    }
    if (el.type === SelectItem) {
      const props = el.props as { value?: string; children?: ReactNode };
      const v = String(props?.value ?? "");
      const label =
        typeof props?.children === "string"
          ? props.children
          : Array.isArray(props?.children)
            ? props.children.join("")
            : String(props?.children ?? v);
      if (v) items.push({ value: v, label });
    }
  });

  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-white/70 dark:bg-black/20 backdrop-blur-sm px-3 text-sm text-foreground shadow-sm outline-none",
        "transition-all duration-200 ease-in-out",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35 focus-visible:border-[var(--color-primary)]/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        triggerClassName
      )}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger(_props: SelectTriggerProps) {
  // Parsed by <Select />; not rendered.
  return null;
}

export function SelectValue(_props: SelectValueProps) {
  // Parsed by <Select />; not rendered.
  return null;
}

export function SelectContent(props: SelectContentProps) {
  // Parsed by <Select />; not rendered.
  return <>{props.children}</>;
}

export function SelectItem(_props: SelectItemProps) {
  // Parsed by <Select />; not rendered.
  return null;
}

