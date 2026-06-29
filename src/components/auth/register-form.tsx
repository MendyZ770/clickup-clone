"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAccounts } from "@/hooks/use-accounts";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";
import { storageSet } from "@/lib/storage";
export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { addAccount } = useAccounts();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: cleanEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Inscription échouée",
          description: data.error || "Une erreur est survenue.",
          variant: "destructive",
        });
        return;
      }

      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (!result?.error) {
        // Standard NextAuth OK
        try {
          const meRes = await fetch("/api/me");
          if (meRes.ok) {
            const me = await meRes.json();
            addAccount({
              id: me.id ?? email,
              email: me.email ?? cleanEmail,
              name: me.name ?? null,
              image: me.image ?? null,
            });
          }
        } catch {
          addAccount({ id: cleanEmail, email: cleanEmail, name: null, image: null });
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Fallback mobile : NextAuth a échoué (webview)
      const mobileRes = await fetch("/api/mobile-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const mobileData = await mobileRes.json();

      if (!mobileRes.ok) {
        toast({
          title: "Connexion échouée",
          description: "Email ou mot de passe incorrect.",
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
    } catch {
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
          Créer un compte
        </motion.h1>
        <motion.p
          className="text-white/40 text-sm mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {"Commencez à gérer vos projets en quelques secondes"}
        </motion.p>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-4">
        <motion.div
          variants={staggerItem}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-4"
          whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/60 text-sm">Nom</Label>
            <Input
              id="name"
              type="text"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              minLength={2}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
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
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white/60 text-sm">Confirmer</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
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
            {isLoading ? "Création..." : "Créer mon compte"}
          </Button>
        </motion.div>

        <motion.p variants={staggerItem} className="text-sm text-white/30 text-center">
          {"Déjà un compte ? "}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Se connecter
          </Link>
        </motion.p>
      </form>
    </motion.div>
  );
}
