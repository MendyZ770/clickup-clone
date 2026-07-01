"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Save, Edit3, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WidgetCard } from "@/components/dashboard/widget-card";
import {
  TasksOverviewWidget,
  StatCardsWidget,
  ActivityFeedWidget,
  WorkloadChartWidget,
} from "@/components/dashboard/widgets";

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Dynamic import of ResponsiveGridLayout to avoid SSR issues
const ResponsiveGridLayout = dynamic(
  () => import("@/components/dashboard/grid-wrapper"),
  { ssr: false }
);

// We have to wait for dynamic import to give us the wrapped component
let Grid: any = ResponsiveGridLayout;

interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
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

  const handleLayoutChange = (newLayout: any[]) => {
    if (!isEditing) return;
    
    setWidgets((prev) =>
      prev.map((widget) => {
        const layoutItem = newLayout.find((l) => l.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
        return widget;
      })
    );
  };

  const saveLayout = async () => {
    if (!dashboardId) return;
    setIsSaving(true);
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: widgets }),
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
          y: Infinity, // puts it at the bottom
          w: type === "stat-cards" ? 8 : 4,
          h: type === "stat-cards" ? 1 : 2,
        }),
      });
      if (res.ok) {
        const newWidget = await res.json();
        setWidgets([...widgets, newWidget]);
        setIsEditing(true); // automatically enter edit mode so they can place it
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    if (!dashboardId) return;
    setWidgets(widgets.filter((w) => w.id !== widgetId));
    try {
      await fetch(`/api/dashboards/${dashboardId}/widgets?widgetId=${widgetId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
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

  if (isLoading || !Grid) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Map widgets to react-grid-layout format
  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 2,
    minH: 1,
  }));

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-background z-10">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vue d'ensemble de ton espace de travail
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <Button onClick={saveLayout} disabled={isSaving}>
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
              <Button variant="secondary">
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
      <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
        {widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Plus className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">Ton tableau de bord est vide</p>
            <p className="text-sm mt-1">Ajoute des widgets depuis le menu en haut à droite.</p>
          </div>
        ) : (
          <div className={isEditing ? "dashboard-editing" : ""}>
            <Grid
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={150}
              onLayoutChange={handleLayoutChange}
              isDraggable={isEditing}
              isResizable={isEditing}
              draggableHandle=".drag-handle"
              compactType="vertical"
              margin={[20, 20]}
            >
              {widgets.map((widget) => (
                <div key={widget.id}>
                  <WidgetCard
                    title={getWidgetTitle(widget.type)}
                    isEditing={isEditing}
                    onDelete={() => removeWidget(widget.id)}
                  >
                    {renderWidgetContent(widget.type)}
                  </WidgetCard>
                </div>
              ))}
            </Grid>
          </div>
        )}
      </div>

      {/* Global styles for editing mode */}
      <style jsx global>{`
        .dashboard-editing .react-grid-item {
          border: 2px dashed hsl(var(--primary) / 0.3);
          border-radius: 0.5rem;
          transition: border-color 0.2s;
        }
        .dashboard-editing .react-grid-item:hover {
          border-color: hsl(var(--primary));
        }
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary));
          opacity: 0.2;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
