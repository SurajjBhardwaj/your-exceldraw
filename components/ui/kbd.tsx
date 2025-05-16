"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Kbd = React.forwardRef<
  HTMLKbdElement,
  React.HTMLAttributes<HTMLKbdElement>
>(({ className, ...props }, ref) => (
  <kbd
    className={cn(
      "inline-flex h-5 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
      className
    )}
    {...props}
    ref={ref}
  />
));
Kbd.displayName = "Kbd";

export { Kbd };
