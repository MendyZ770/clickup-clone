"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  Plus,
  Edit3,
  ArrowRightLeft,
  MessageSquare,
  Trash2,
  Lock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityWithUser } from "@/types";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

const ACTION_ICONS: Record<string, typeof Activity> = {
  created: Plus,
  updated: Edit3,
  status_changed: ArrowRightLeft,
  commented: MessageSquare,
  deleted: Trash2,
  locked: Lock,
};

const FIELD_LABELS: Record<string, string> = {
  title: "titre",
  description: "description",
  priority: "priorité",
  dueDate: "échéance",
  status: "statut",
  assignee: "assigné",
  list: "liste",
  startDate: "date de début",
  timeEstimate: "estimation",
  locked: "verrouillage",
  duplicate: "tâche",
};

interface ActivityFeedProps {
  taskId: string;
}

export function ActivityFeed({ taskId }: ActivityFeedProps) {
  const { data: activities, isLoading } = useSWR<ActivityWithUser[]>(
    `/api/tasks/${taskId}/activity`,
    fetcher
  );

  const getDescription = (activity: ActivityWithUser) => {
    const name = activity.user.name ?? activity.user.email;
    switch (activity.action) {
      case "created":
        return `${name} a créé cette tâche`;
      case "commented":
        return `${name} a commenté`;
      case "deleted":
        return `${name} a supprimé cette tâche`;
      case "updated":
        if (activity.field) {
          const label = FIELD_LABELS[activity.field] ?? activity.field;
          if (activity.field === "locked") {
            return activity.newValue === "locked"
              ? `${name} a verrouillé la tâche`
              : `${name} a déverrouillé la tâche`;
          }
          return `${name} a modifié ${label}${
            activity.oldValue ? ` de « ${activity.oldValue} »` : ""
          }${activity.newValue ? ` en « ${activity.newValue} »` : ""}`;
        }
        return `${name} a mis à jour la tâche`;
      default:
        return `${name} — ${activity.action}`;
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <motion.h3 variants={staggerItem} className="text-sm font-semibold flex items-center gap-1.5">
        <Activity className="h-5 w-5" />
        Activité
      </motion.h3>

      {isLoading ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={staggerItem} className="flex gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {(activities ?? []).map((activity) => {
            const Icon = ACTION_ICONS[activity.action] ?? Activity;
            return (
              <motion.div
                key={activity.id}
                variants={staggerItem}
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-start gap-2.5"
              >
                <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={activity.user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(activity.user.name ?? activity.user.email)
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <Icon className="inline h-4 w-4 mr-1" />
                    {getDescription(activity)}
                  </p>
                  <span className="text-xs text-muted-foreground/60">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {activities?.length === 0 && (
            <motion.p variants={staggerItem} className="text-sm text-muted-foreground text-center py-4">
              Aucune activité pour le moment
            </motion.p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
