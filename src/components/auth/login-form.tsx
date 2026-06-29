"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { QuickAccounts } from "./quick-accounts";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";
import { storageSet } from "@/lib/storage";

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error Capacitor global
  return !!(window.Capacitor?.isNativePlatform?.());
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addAccount } = useAccounts();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const native = isNativeApp();

      // ── Mode Web standard ──
      if (!native) {
        const result = await signIn("credentials", {
          email: cleanEmail,
          password,
          redirect: false,
        });

        if (!result?.error) {
          try {
            const meRes = await fetch("/api/me");
            if (meRes.ok) {
              const me = await meRes.json();
              addAccount({
                id: me.id ?? cleanEmail,
                email: me.email ?? cleanEmail,
                name: me.name ?? null,
                image: me.image ?? null,
              });
            }
          } catch {
            addAccount({
              id: cleanEmail,
              email: cleanEmail,
              name: null,
              image: null,
            });
          }
          router.push("/dashboard");
          router.refresh();
          return;
        }

        toast({
          title: "Connexion échouée",
          description: "Email ou mot de passe incorrect.",
          variant: "destructive",
        });
        return;
      }

      // ── Mode Native (Capacitor) : mobile-login direct ──
      const mobileRes = await fetch("/api/mobile-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const mobileData = await mobileRes.json();

      if (!mobileRes.ok) {
        const description =
          mobileData.code === "NO_PASSWORD"
            ? "Ce compte n'a pas de mot de passe. Connectez-vous sur le web d'abord pour en créer un."
            : mobileData.code === "USER_NOT_FOUND"
            ? "Aucun compte trouvé avec cet email."
            : "Email ou mot de passe incorrect.";

        toast({
          title: "Connexion échouée",
          description,
          variant: "destructive",
        });
        return;
      }

      await storageSet("mobile_auth_token", mobileData.token);
      addAccount({
        id: mobileData.user.id,
        email: mobileData.user.email,
        name: mobileData.user.name ?? null,
        image: mobileData.user.image ?? null,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Erreur",
        description: "Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.div variants={staggerItem} className="text-center mb-8">
        <motion.div
          className="flex justify-center mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <motion.div
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <span className="text-white font-bold text-lg">D</span>
          </motion.div>
        </motion.div>
        <motion.h1
          className="text-2xl font-bold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Bon retour
        </motion.h1>
        <motion.p
          className="text-white/40 text-sm mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {"Connectez-vous à votre espace de travail"}
        </motion.p>
      </motion.div>

      <QuickAccounts />

      <form onSubmit={onSubmit} className="space-y-4">
        <motion.div
          variants={staggerItem}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-4"
          whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>

        <motion.div variants={staggerItem}>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold py-5 shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </motion.div>

        <motion.p variants={staggerItem} className="text-sm text-white/30 text-center">
          {"Pas encore de compte ? "}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </motion.p>
      </form>

      <motion.div variants={staggerItem} className="mt-6 flex items-center justify-center gap-4 text-xs text-white/20">
        <Link
          href="/privacy"
          className="hover:text-white/40 transition-colors"
        >
          Politique de confidentialité
        </Link>
        <span>|</span>
        <Link
          href="/terms"
          className="hover:text-white/40 transition-colors"
        >
          Conditions
        </Link>
      </motion.div>
    </motion.div>
  );
}
