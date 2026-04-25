"use client";

import { useState } from "react";
import {
  Loader2,
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MemberListProps {
  workspaceId: string;
  members: Member[];
  onMemberAdded: () => void;
  onMemberRemoved: () => void;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: typeof Shield; color: string }
> = {
  owner: { label: "Owner", icon: Crown, color: "text-yellow-500" },
  admin: { label: "Admin", icon: ShieldCheck, color: "text-blue-500" },
  member: { label: "Member", icon: Shield, color: "text-muted-foreground" },
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function MemberList({
  workspaceId,
  members,
  onMemberAdded,
  onMemberRemoved,
}: MemberListProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), role }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }

      setEmail("");
      setRole("member");
      onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: Member) => {
    setRemovingId(member.id);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members?memberId=${member.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }

      onMemberRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRemovingId(null);
      setConfirmRemove(null);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Members</CardTitle>
        <CardDescription>
          Manage who has access to this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite form */}
        <form onSubmit={handleInvite} className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="invite-email">Invite by email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviting || !email.trim()}>
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
          </Button>
        </form>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Separator />

        {/* Member list */}
        <div className="space-y-2">
          {members.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
            const RoleIcon = roleConfig.icon;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.user.image ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                    {getInitials(member.user.name, member.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("gap-1 text-[10px]", roleConfig.color)}
                >
                  <RoleIcon className="h-3 w-3" />
                  {roleConfig.label}
                </Badge>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    disabled={removingId === member.id}
                    onClick={() => setConfirmRemove(member)}
                  >
                    {removingId === member.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Confirm remove dialog */}
      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={() => setConfirmRemove(null)}
        title="Remove member"
        description={`Are you sure you want to remove ${confirmRemove?.user.name ?? confirmRemove?.user.email} from this workspace?`}
        onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
        variant="destructive"
      />
    </Card>
  );
}
