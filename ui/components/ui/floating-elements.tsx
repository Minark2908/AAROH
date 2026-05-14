"use client";
import { Leaf, Sprout, Wheat, Droplets } from 'lucide-react';

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[20%] left-[10%] animate-float-leaf" style={{ animationDelay: '0s' }}>
        <Leaf className="h-6 w-6 text-primary/10" />
      </div>
      <div className="absolute top-[40%] right-[15%] animate-float-leaf" style={{ animationDelay: '2s' }}>
        <Sprout className="h-5 w-5 text-primary/8" />
      </div>
      <div className="absolute top-[60%] left-[70%] animate-float-leaf" style={{ animationDelay: '4s' }}>
        <Wheat className="h-7 w-7 text-accent/8" />
      </div>
      <div className="absolute bottom-[20%] left-[20%] animate-drift" style={{ animationDelay: '1s' }}>
        <Leaf className="h-4 w-4 text-primary/6 rotate-45" />
      </div>
      <div className="absolute bottom-[40%] right-[25%] animate-drift" style={{ animationDelay: '3s' }}>
        <Droplets className="h-5 w-5 text-primary/6" />
      </div>
    </div>
  );
}
