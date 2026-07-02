"use client";

import { useState, useEffect } from "react";
import { useUnifiedSession } from "@/hooks/use-unified-session";
import { User, Lock, Bell, Moon, Sun, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AvatarUpload } from "@/components/user/avatar-upload";

interface NotifPrefs {
  taskAssigned: boolean;
  taskComment: boolean;
  taskStatusChanged: boolean;
  taskDueSoon: boolean;
  dailySummary: boolean;
  reminders: boolean;
  teamActivity: boolean;
  budgetAlert: boolean;
  pushEnabled: boolean;
}

const NOTIF_ITEMS: { key: keyof NotifPrefs; label: string; description: string }[] = [
  { key: "pushEnabled",       label: "Notifications push",         description: "Activer/désactiver toutes les notifications push" },
  { key: "taskAssigned",      label: "Tâche assignée",             description: "Quand une tâche vous est assignée" },
  { key: "taskComment",       label: "Nouveau commentaire",        description: "Quand quelqu'un commente une de vos tâches" },
  { key: "taskStatusChanged", label: "Changement de statut",       description: "Quand le statut d'une tâche change" },
  { key: "taskDueSoon",       label: "Échéance proche",            description: "24h avant l'échéance d'une tâche" },
  { key: "dailySummary",      label: "Résumé quotidien",           description: "Récapitulatif de vos tâches du jour à 8h" },
  { key: "reminders",         label: "Rappels",                    description: "Vos rappels personnels" },
  { key: "teamActivity",      label: "Activité de l'équipe",       description: "Modifications faites par vos coéquipiers" },
  { key: "budgetAlert",       label: "Alertes budget",             description: "Quand un budget atteint 80% ou 100%" },
];

export default function SettingsPage() {
  const { user: sessionUser } = useUnifiedSession();
  const { toast } = useToast();
  const { mode, setMode } = useTheme();

  // Profil
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    taskAssigned: true,
    taskComment: true,
    taskStatusChanged: true,
    taskDueSoon: true,
    dailySummary: true,
    reminders: true,
    teamActivity: true,
    budgetAlert: true,
    pushEnabled: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    if (sessionUser?.name) setName(sessionUser.name);
  }, [sessionUser?.name]);

  useEffect(() => {
    fetch("/api/me/notification-preferences")
      .then((r) => r.json())
      .then((data) => setNotifPrefs(data))
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Erreur", description: "Le nom ne peut pas être vide", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      toast({ title: "Profil mis à jour" });
      window.location.reload();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Erreur", description: "8 caractères minimum", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast({ title: "Mot de passe mis à jour" });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleNotif = async (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setSavingNotifs(true);
    try {
      const res = await fetch("/api/me/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error("Erreur");
    } catch {
      // Rollback
      setNotifPrefs(notifPrefs);
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSavingNotifs(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        icon={User}
        title="Paramètres du compte"
        description="Gérez votre profil, mot de passe et notifications"
      />

      {/* Profil */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Profil</CardTitle>
          <CardDescription>Votre nom et votre avatar visibles par les autres membres</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <AvatarUpload />
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={sessionUser?.email ?? ""} disabled readOnly />
              <p className="text-[10px] text-muted-foreground">{"L'email n'est pas modifiable pour le moment."}</p>
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Thème */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Thème de l'application
          </CardTitle>
          <CardDescription>Choisissez votre thème préféré</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant={mode === "light" ? "default" : "outline"}
              onClick={() => setMode("light")}
              className="flex-1"
            >
              <Sun className="mr-2 h-4 w-4" /> Clair
            </Button>
            <Button
              variant={mode === "dark" ? "default" : "outline"}
              onClick={() => setMode("dark")}
              className="flex-1"
            >
              <Moon className="mr-2 h-4 w-4" /> Sombre
            </Button>
            <Button
              variant={mode === "system" ? "default" : "outline"}
              onClick={() => setMode("system")}
              className="flex-1"
            >
              Système
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Mot de passe
          </CardTitle>
          <CardDescription>{"Modifiez votre mot de passe d'accès"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Mot de passe actuel</Label>
              <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">Nouveau mot de passe</Label>
              <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={8} />
              <p className="text-[10px] text-muted-foreground">8 caractères minimum.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Changer le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choisissez ce que vous voulez recevoir comme notification push sur votre téléphone
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingNotifs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {NOTIF_ITEMS.map((item, i) => (
                <div key={item.key}>
                  {i === 1 && (
                    <div className="my-3 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Types de notifications</p>
                    </div>
                  )}
                  <div className={`flex items-center justify-between py-3 ${i === 0 ? "pb-4 border-b mb-1" : ""}`}>
                    <div className="space-y-0.5 flex-1 pr-4">
                      <p className={`text-sm font-medium ${i === 0 ? "text-base" : ""}`}>{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[item.key]}
                      onCheckedChange={(v: boolean) => handleToggleNotif(item.key, v)}
                      disabled={savingNotifs || (item.key !== "pushEnabled" && !notifPrefs.pushEnabled)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
