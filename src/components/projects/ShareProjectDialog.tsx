import { useState } from "react";
import { Users, UserPlus, Trash2, Crown, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  editor: "Éditeur",
  viewer: "Lecteur",
};

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  editor: Pencil,
  viewer: Eye,
};

export function ShareProjectDialog() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const { members, isOwner, inviteMember, removeMember } = useProjectMembers();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [isOpen, setIsOpen] = useState(false);

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMember.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail("");
        },
      }
    );
  };

  if (!currentProject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Partager
          {members.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {members.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager « {currentProject.nom_projet} »</DialogTitle>
        </DialogHeader>

        {/* Owner info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Crown className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Propriétaire</p>
            </div>
          </div>

          {/* Existing members */}
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role] || Eye;
            return (
              <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                <RoleIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {member.display_name || member.email || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[member.role] || member.role}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeMember.mutate(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {isOwner && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label>Inviter un collaborateur</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@exemple.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="flex-1"
                />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Éditeur</SelectItem>
                    <SelectItem value="viewer">Lecteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || inviteMember.isPending}
                className="w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {inviteMember.isPending ? "Invitation…" : "Inviter"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
