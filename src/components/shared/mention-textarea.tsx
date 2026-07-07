"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionedUsers?: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  members?: Member[];
  rows?: number;
}

export function MentionTextarea({
  value,
  onChange,
  onMentionedUsers,
  placeholder,
  className,
  disabled,
  onKeyDown,
  members = [],
  rows = 3,
}: MentionTextareaProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());

  const filteredMembers = useMemo(() => {
    return mentionQuery !== null
      ? members
          .filter((m) => {
            const name = (m.name ?? m.email).toLowerCase();
            return (
              (mentionQuery.length > 0 &&
                name.includes(mentionQuery.toLowerCase())) ||
              mentionQuery === ""
            );
          })
          .slice(0, 6)
      : [];
  }, [mentionQuery, members]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart ?? 0;
      onChange(newValue);

      // Detect @ mention trigger
      const textBeforeCursor = newValue.slice(0, cursor);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const afterAt = textBeforeCursor.slice(atIndex + 1);
        // Only trigger if there's no space in the query (single word)
        if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
          setMentionQuery(afterAt);
          setMentionStart(atIndex);
          setSelectedIndex(0);
          return;
        }
      }

      setMentionQuery(null);
      setMentionStart(-1);
    },
    [onChange]
  );

  const insertMention = useCallback(
    (member: Member) => {
      const displayName = member.name ?? member.email.split("@")[0];
      const before = value.slice(0, mentionStart);
      const after = value.slice(
        textareaRef.current?.selectionStart ?? mentionStart
      );
      const newValue = `${before}@${displayName} ${after}`;
      onChange(newValue);
      const newMentionedIds = new Set(mentionedIds).add(member.id);
      setMentionedIds(newMentionedIds);
      onMentionedUsers?.([...newMentionedIds]);
      setMentionQuery(null);
      setMentionStart(-1);

      // Focus back and set cursor after inserted mention
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const pos = before.length + displayName.length + 2; // @name + space
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        }
      }, 0);
    },
    [value, mentionStart, onChange, mentionedIds, onMentionedUsers]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionQuery !== null && filteredMembers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filteredMembers.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (i) => (i - 1 + filteredMembers.length) % filteredMembers.length
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filteredMembers[selectedIndex]);
          return;
        }
        if (e.key === "Escape") {
          setMentionQuery(null);
          return;
        }
      }
      onKeyDown?.(e);
    },
    [mentionQuery, filteredMembers, selectedIndex, insertMention, onKeyDown]
  );

  // Extract mentioned user IDs from final text when value changes
  useEffect(() => {
    const mentioned: string[] = [];
    for (const member of members) {
      const displayName = member.name ?? member.email.split("@")[0];
      if (value.includes(`@${displayName}`)) {
        mentioned.push(member.id);
      }
    }
    // Only update if changed
    const current = [...mentionedIds].sort().join(",");
    const next = [...mentioned].sort().join(",");
    if (current !== next) {
      setMentionedIds(new Set(mentioned));
      onMentionedUsers?.(mentioned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, members]);

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
      />

      {/* Mention dropdown */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 z-50 w-64 rounded-lg border bg-popover p-1 shadow-lg">
          <p className="px-2 py-1 text-xs text-muted-foreground">Membres</p>
          {filteredMembers.map((member, i) => (
            <button
              key={member.id}
              type="button"
              onClick={() => insertMention(member)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                i === selectedIndex && "bg-accent"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(member.name ?? member.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.name ?? member.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
