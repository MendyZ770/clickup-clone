"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Star,
  Link,
  Mail,
  Phone,
  DollarSign,
  Check,
  X,
  Calendar,
  Type,
  Hash,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarWidget,
} from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CustomFieldRendererProps {
  fieldType: string;
  fieldName: string;
  value: string | null;
  options?: string[]; // for dropdown
  onChange: (value: string | null) => void;
  mode?: "view" | "edit";
  className?: string;
}

export function CustomFieldRenderer({
  fieldType,
  fieldName,
  value,
  options,
  onChange,
  mode = "edit",
  className,
}: CustomFieldRendererProps) {
  void fieldName;
  void options;
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  const handleSave = () => {
    onChange(localValue || null);
    setEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value ?? "");
    setEditing(false);
  };

  if (mode === "view") {
    return (
      <div className={cn("text-sm", className)}>
        {renderViewValue(fieldType, value, options)}
      </div>
    );
  }

  switch (fieldType) {
    case "text":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setLocalValue(value ?? ""); setEditing(true); }}
              className="text-sm text-left truncate hover:text-primary transition-colors min-w-0 flex-1"
            >
              {value || <span className="text-muted-foreground italic">Empty</span>}
            </button>
          )}
        </div>
      );

    case "number":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setLocalValue(value ?? ""); setEditing(true); }}
              className="text-sm text-left truncate hover:text-primary transition-colors"
            >
              {value ?? <span className="text-muted-foreground italic">Empty</span>}
            </button>
          )}
        </div>
      );

    case "dropdown":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-sm justify-between", className)}>
              <span className="truncate">
                {value || <span className="text-muted-foreground">Select...</span>}
              </span>
              <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            {(options ?? []).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors",
                  value === opt && "bg-primary/10 font-medium"
                )}
              >
                {opt}
              </button>
            ))}
            {value && (
              <>
                <div className="border-t my-1" />
                <button
                  onClick={() => onChange(null)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-muted-foreground"
                >
                  Clear
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      );

    case "checkbox":
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Checkbox
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          />
          <span className="text-sm text-muted-foreground">
            {value === "true" ? "Yes" : "No"}
          </span>
        </div>
      );

    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-sm", className)}>
              <Calendar className="h-3 w-3 mr-1" />
              {value ? format(new Date(value), "MMM d, yyyy") : "Set date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarWidget
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => onChange(date ? date.toISOString() : null)}
            />
          </PopoverContent>
        </Popover>
      );

    case "url":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="url"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder="https://..."
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setLocalValue(value ?? ""); setEditing(true); }}
              className="text-sm text-left truncate hover:text-primary transition-colors flex items-center gap-1"
            >
              <Link className="h-3 w-3 shrink-0" />
              {value ? (
                <span className="text-blue-500 underline truncate">{value}</span>
              ) : (
                <span className="text-muted-foreground italic">Add URL</span>
              )}
            </button>
          )}
        </div>
      );

    case "email":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="email"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder="email@example.com"
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setLocalValue(value ?? ""); setEditing(true); }}
              className="text-sm text-left truncate hover:text-primary transition-colors flex items-center gap-1"
            >
              <Mail className="h-3 w-3 shrink-0" />
              {value || <span className="text-muted-foreground italic">Add email</span>}
            </button>
          )}
        </div>
      );

    case "phone":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                type="tel"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder="+1 (555) 000-0000"
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setLocalValue(value ?? ""); setEditing(true); }}
              className="text-sm text-left truncate hover:text-primary transition-colors flex items-center gap-1"
            >
              <Phone className="h-3 w-3 shrink-0" />
              {value || <span className="text-muted-foreground italic">Add phone</span>}
            </button>
          )}
        </div>
      );

    case "currency":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="h-7 text-sm pl-6"
                  autoFocus
                />
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setLocalValue(value ?? ""); setEditing(true); }}
              className="text-sm text-left truncate hover:text-primary transition-colors flex items-center gap-1"
            >
              <DollarSign className="h-3 w-3 shrink-0" />
              {value ? parseFloat(value).toFixed(2) : <span className="text-muted-foreground italic">0.00</span>}
            </button>
          )}
        </div>
      );

    case "rating":
      return (
        <div className={cn("flex items-center gap-0.5", className)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange(value === String(star) ? null : String(star))}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  star <= (value ? parseInt(value) : 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      );

    default:
      return (
        <span className="text-sm text-muted-foreground">
          Unsupported field type: {fieldType}
        </span>
      );
  }
}

function renderViewValue(
  type: string,
  value: string | null,
  /* options is reserved for future dropdown display */
): React.ReactNode {
  if (!value) {
    return <span className="text-muted-foreground italic">--</span>;
  }

  switch (type) {
    case "checkbox":
      return value === "true" ? "Yes" : "No";
    case "date":
      return format(new Date(value), "MMM d, yyyy");
    case "currency":
      return `$${parseFloat(value).toFixed(2)}`;
    case "rating":
      return (
        <span className="inline-flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "h-3 w-3",
                s <= parseInt(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          ))}
        </span>
      );
    case "url":
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline truncate">
          {value}
        </a>
      );
    default:
      return value;
  }
}

export function getFieldTypeIcon(type: string) {
  switch (type) {
    case "text": return Type;
    case "number": return Hash;
    case "dropdown": return ChevronDown;
    case "checkbox": return Check;
    case "date": return Calendar;
    case "url": return Link;
    case "email": return Mail;
    case "phone": return Phone;
    case "currency": return DollarSign;
    case "rating": return Star;
    default: return Type;
  }
}
