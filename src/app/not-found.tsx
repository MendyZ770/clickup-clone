import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
          <FileQuestion className="h-8 w-8 text-purple-400" />
        </div>

        <h1 className="text-2xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-white/40 text-sm">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
