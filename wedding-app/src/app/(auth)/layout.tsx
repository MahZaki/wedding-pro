import type { ReactNode } from "react";
import { VowlyLogo } from "@/components/brand/VowlyLogo";
import { ConvergingPaths } from "@/components/brand/ConvergingPaths";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-paper p-4 overflow-hidden">
      {/* "Two paths" brand motif — PRD §18 */}
      <ConvergingPaths className="absolute inset-x-0 top-0 h-[420px] pointer-events-none" />

      <div className="relative mb-8">
        <VowlyLogo size={34} animated />
      </div>
      <div className="relative bg-white rounded-xl border border-ink-200 shadow-sm p-6 w-full max-w-md">
        {children}
      </div>
      <p className="relative mt-6 text-xs text-ink-400 text-center max-w-xs">
        Private by design. We never sell your data or share it with vendors.
      </p>
    </div>
  );
}
