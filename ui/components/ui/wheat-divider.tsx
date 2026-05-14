"use client";
import { Wheat } from 'lucide-react';

export function WheatDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-border" />
      <Wheat className="h-5 w-5 text-primary/30 animate-sway" />
      <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}
