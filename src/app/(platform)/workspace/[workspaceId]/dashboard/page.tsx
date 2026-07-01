"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Save, Edit3, Loader2 } from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableWidget } from "@/components/dashboard/sortable-widget";
import {
  TasksOverviewWidget,
  StatCardsWidget,
  ActivityFeedWidget,
  WorkloadChartWidget,
} from "@/components/dashboard/widgets";

interface Widget {
  id: string;
  type: string;
  w: number;
  h: number;
}

export default function DashboardPage() {
  const params = useParams<{ workspaceId: string }>();
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/dashboards?workspaceId=${params.workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setDashboardId(data[0].id);
            setWidgets(data[0].widgets);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [params.workspaceId]);

  const saveLayout = async (currentWidgets = widgets) => {
    if (!dashboardId) return;
    setIsSaving(true);
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: currentWidgets }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addWidget = async (type: string, title: string) => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          x: 0,
          y: 0,
          w: type === "stat-cards" ? 2 : 1,
          h: 1,
        }),
      });
      if (res.ok) {
        const newWidget = await res.json();
        setWidgets((prev) => [...prev, newWidget]);
        setIsEditing(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    if (!dashboardId) return;
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets?widgetId=${widgetId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderWidgetContent = (type: string) => {
    switch (type) {
      case "tasks-overview":
        return <TasksOverviewWidget />;
      case "stat-cards":
        return <StatCardsWidget />;
      case "activity-feed":
        return <ActivityFeedWidget />;
      case "workload":
        return <WorkloadChartWidget />;
      default:
        return <div>Widget Inconnu</div>;
    }
  };

  const getWidgetTitle = (type: string) => {
    switch (type) {
      case "tasks-overview":
        return "Répartition des Tâches";
      case "stat-cards":
        return "Vue d'ensemble";
      case "activity-feed":
        return "Activité Récente";
      case "workload":
        return "Charge de Travail";
      default:
        return "Widget";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-background z-10">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bonjour 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici ce qui se passe dans ton espace de travail aujourd'hui.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <Button onClick={() => saveLayout()} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Terminé
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Personnaliser
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="shadow-md hover:shadow-lg transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un widget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => addWidget("stat-cards", "Vue d'ensemble")}>
                Compteurs / Statistiques
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("tasks-overview", "Répartition")}>
                Graphique (Tâches)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("workload", "Charge de Travail")}>
                Graphique (Charge)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addWidget("activity-feed", "Activité Récente")}>
                Flux d'activité
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-y-auto bg-muted/5 p-6 md:p-8">
        {widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Plus className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">Ton tableau de bord est vide</p>
            <p className="text-sm mt-1">Ajoute des widgets depuis le menu en haut à droite.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((w) => w.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[minmax(350px,auto)]">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className={widget.type === "stat-cards" ? "md:col-span-2 h-fit" : ""}
                  >
                    <SortableWidget
                      id={widget.id}
                      title={getWidgetTitle(widget.type)}
                      type={widget.type}
                      isEditing={isEditing}
                      onDelete={() => removeWidget(widget.id)}
                    >
                      {renderWidgetContent(widget.type)}
                    </SortableWidget>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
