"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Connexion echouee",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive",
        });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Veuillez reessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <span className="text-white font-bold text-lg">D</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Bon retour</h1>
        <p className="text-white/40 text-sm mt-1">
          Connectez-vous a votre espace de travail
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="dev@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/60 text-sm">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold py-5 shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </Button>

        <p className="text-sm text-white/30 text-center">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Creer un compte
          </Link>
        </p>
      </form>
    </div>
  );
}
