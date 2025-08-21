"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: React.ReactNode;
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative z-10",
          { "bg-background text-foreground shadow-sm": selected },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Tab.displayName = "Tab";