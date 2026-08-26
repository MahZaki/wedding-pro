import type { ReactNode } from "react";
import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="font-heading text-3xl font-bold text-slate-700">
          Vowly
        </span>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full max-w-md">
        {children}
      </div>
      <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
        Private by design. We never sell your data or share it with vendors.
      </p>
    </div>
  );
}
