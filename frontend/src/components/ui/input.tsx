import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
