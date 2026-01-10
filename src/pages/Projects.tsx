import { useState } from "react";
import { Plus, Copy, Trash2, FolderOpen, MoreVertical } from "lucide-react";
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

interface Project {
  id: string;
  name: string;
  description: string;
  productsCount: number;
  lastUpdated: string;
  status: "active" | "draft" | "archived";
}

const initialProjects: Project[] = [
  {
    id: "1",
    name: "Conserverie du Terroir",
    description: "Production de sauces et confitures artisanales",
    productsCount: 8,
    lastUpdated: "10 Jan 2026",
    status: "active",
  },
  {
    id: "2",
    name: "Ferme des Collines",
    description: "Transformation laitière et fromages",
    productsCount: 5,
    lastUpdated: "08 Jan 2026",
    status: "active",
  },
  {
    id: "3",
    name: "Atelier Cidricole",
    description: "Jus de fruits et cidres artisanaux",
    productsCount: 4,
    lastUpdated: "05 Jan 2026",
    status: "draft",
  },
];

const getStatusBadge = (status: Project["status"]) => {
  switch (status) {
    case "active":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Actif</Badge>;
    case "draft":
      return <Badge variant="outline" className="text-muted-foreground">Brouillon</Badge>;
    case "archived":
      return <Badge variant="secondary">Archivé</Badge>;
  }
};

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      const project: Project = {
        id: Date.now().toString(),
        name: newProject.name,
        description: newProject.description,
        productsCount: 0,
        lastUpdated: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: "draft",
      };
      setProjects([project, ...projects]);
      setNewProject({ name: "", description: "" });
      setIsDialogOpen(false);
    }
  };

  const handleDuplicateProject = (project: Project) => {
    const duplicate: Project = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (copie)`,
      lastUpdated: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "draft",
    };
    setProjects([duplicate, ...projects]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
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
              <Button onClick={handleCreateProject} className="w-full">
                Créer le projet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="transition-all hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <FolderOpen className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDuplicateProject(project)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteProject(project.id)}
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
                {project.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.productsCount} produits</span>
                <span>Modifié le {project.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default Projects;
