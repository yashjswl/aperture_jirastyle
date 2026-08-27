import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] focus:bg-[rgba(255,255,255,0.06)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all",
          className
        )}
        style={{ colorScheme: "dark" }}
        {...props}
      />
    );
  }
);
