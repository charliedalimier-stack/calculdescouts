import { useState } from "react";
import { Plus, Copy, Trash2, FolderOpen, MoreVertical, Loader2, Check, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/useProjects";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Projects = () => {
  const { projects, isLoading, addProject, deleteProject, duplicateProject } = useProjects();
  const { currentProject, setCurrentProject } = useProject();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  // Fetch member counts for all projects
  const { data: memberCounts = {} } = useQuery({
    queryKey: ['project-member-counts', projects.map(p => p.id)],
    queryFn: async () => {
      if (projects.length === 0) return {};
      const { data } = await supabase
        .from('project_members')
        .select('project_id')
        .in('project_id', projects.map(p => p.id));
      
      const counts: Record<string, number> = {};
      data?.forEach((m: any) => {
        counts[m.project_id] = (counts[m.project_id] || 0) + 1;
      });
      return counts;
    },
    enabled: projects.length > 0,
  });

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      addProject.mutate({
        nom_projet: newProject.name,
        description: newProject.description || null,
      });
      setNewProject({ name: "", description: "" });
      setIsDialogOpen(false);
    }
  };

  const handleDuplicateProject = (id: string) => {
    duplicateProject.mutate(id);
  };

  const handleDeleteProject = (id: string) => {
    if (currentProject?.id === id) {
      const remaining = projects.filter(p => p.id !== id);
      if (remaining.length > 0) {
        setCurrentProject(remaining[0]);
      }
    }
    deleteProject.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AppLayout
      title="Projets"
      subtitle="Gérez vos entreprises et projets de transformation"
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projects.length} projet{projects.length > 1 ? "s" : ""} au total
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du projet</Label>
                <Input
                  id="name"
                  placeholder="Ex: Ma Conserverie"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre activité..."
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleCreateProject}
                className="w-full"
                disabled={addProject.isPending}
              >
                {addProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le projet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun projet. Créez-en un pour commencer !</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={`transition-all hover:shadow-md cursor-pointer ${
                currentProject?.id === project.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setCurrentProject(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <FolderOpen className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {project.nom_projet}
                        {currentProject?.id === project.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                      <Badge className="bg-primary/10 text-primary border-primary/20 mt-1">
                        {project.owner_user_id === user?.id ? "Propriétaire" : "Partagé"}
                      </Badge>
                      {(memberCounts[project.id] || 0) > 0 && (
                        <Badge variant="outline" className="mt-1 ml-1">
                          <Users className="mr-1 h-3 w-3" />
                          {memberCounts[project.id]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProject(project.id);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {project.description || "Aucune description"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Modifié le {formatDate(project.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Projects;
