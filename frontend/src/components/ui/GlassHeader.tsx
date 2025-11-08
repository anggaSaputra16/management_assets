import React from "react";

export function GlassHeader({ 
  title, 
  right 
}: { 
  title: string; 
  right?: React.ReactNode 
}) {
  return (
    <header className="sticky top-0 z-40 glass-muted backdrop-blur-sm border-b border-[var(--glass-border)]">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold text-[var(--ink)]">{title}</h1>
        {right && <div>{right}</div>}
      </div>
    </header>
  );
}
