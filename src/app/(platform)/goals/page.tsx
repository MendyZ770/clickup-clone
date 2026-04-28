"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Target, Plus, Loader2, Trash2 } from "lucide-react";
import useSWR from "swr";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface GoalTarget {
  id: string;
  name: string;
  type: string;
  currentValue: number;
  targetValue: number;
  unit: string | null;
}

interface Goal {
  id: string;
  name: string;
  description: string | null;
  color: string;
  dueDate: string | null;
  targets: GoalTarget[];
  creator: { id: string; name: string | null; image: string | null };
}

export default function GoalsPage() {
  const { currentWorkspace } = useWorkspace();
  const { data: goals, mutate } = useSWR<Goal[]>(
    currentWorkspace ? `/api/goals?workspaceId=${currentWorkspace.id}` : null,
    fetcher
  );

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [targetName, setTargetName] = useState("");
  const [targetValue, setTargetValue] = useState("100");

  const handleCreate = async () => {
    if (!newName.trim() || !currentWorkspace) return;
    setCreating(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc || null, workspaceId: currentWorkspace.id }),
      });
      setNewName("");
      setNewDesc("");
      setDialogOpen(false);
      mutate();
    } finally {
      setCreating(false);
    }
  };

  const handleAddTarget = async (goalId: string) => {
    if (!targetName.trim()) return;
    await fetch(`/api/goals/${goalId}/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: targetName, targetValue: parseFloat(targetValue) || 100 }),
    });
    setTargetName("");
    setTargetValue("100");
    mutate();
  };

  const handleUpdateTarget = async (goalId: string, targetId: string, currentValue: number) => {
    await fetch(`/api/goals/${goalId}/targets`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: targetId, currentValue }),
    });
    mutate();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    mutate();
  };

  const getProgress = (goal: Goal) => {
    if (goal.targets.length === 0) return 0;
    const avg = goal.targets.reduce((sum, t) => sum + Math.min(100, (t.currentValue / t.targetValue) * 100), 0) / goal.targets.length;
    return Math.round(avg);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Objectifs</h1>
              <p className="text-sm text-muted-foreground">Suivez vos objectifs et KPIs</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Nouvel objectif
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un objectif</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Nom de l'objectif" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Description (optionnel)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full">
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!goals || goals.length === 0) && (
          <div className="text-center py-16">
            <Target className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun objectif pour le moment</p>
          </div>
        )}

        <div className="grid gap-4">
          {(goals ?? []).map((goal) => {
            const progress = getProgress(goal);
            const isExpanded = selectedGoal === goal.id;
            return (
              <Card key={goal.id} className="overflow-hidden">
                <div className="h-1" style={{ backgroundColor: goal.color }} />
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <button onClick={() => setSelectedGoal(isExpanded ? null : goal.id)} className="text-left flex-1">
                      <h3 className="font-semibold">{goal.name}</h3>
                      {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: goal.color }}>{progress}%</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{goal.targets.length} cible(s)</span>
                    {goal.dueDate && <span>Échéance: {format(new Date(goal.dueDate), "d MMM yyyy")}</span>}
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t">
                      {goal.targets.map((target) => {
                        const pct = Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));
                        return (
                          <div key={target.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>{target.name}</span>
                              <span className="font-mono">{target.currentValue}/{target.targetValue} {target.unit ?? ""}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-1.5 flex-1" />
                              <input
                                type="number"
                                className="w-16 h-6 text-xs border rounded px-1"
                                value={target.currentValue}
                                onChange={(e) => handleUpdateTarget(goal.id, target.id, parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 pt-1">
                        <Input
                          placeholder="Nom de la cible"
                          value={targetName}
                          onChange={(e) => setTargetName(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Objectif"
                          value={targetValue}
                          onChange={(e) => setTargetValue(e.target.value)}
                          className="h-7 text-xs w-20"
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleAddTarget(goal.id)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
