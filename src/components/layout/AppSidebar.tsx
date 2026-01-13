import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Apple,
  Box,
  ChefHat,
  Calculator,
  TrendingUp,
  Wallet,
  BarChart3,
  Target,
  FolderOpen,
  FileText,
  Settings,
  Activity,
  Crosshair,
  ShieldAlert,
  Warehouse,
  Receipt,
  Globe,
  Briefcase,
  LogOut,
  User,
  Scale,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Tableau de bord", icon: LayoutDashboard, path: "/" },
  { title: "Synthèse Globale", icon: Globe, path: "/global" },
  { title: "Budget vs Réel", icon: Scale, path: "/budget-vs-reel" },
  { title: "Rapports", icon: FileText, path: "/reports" },
  { title: "Projets", icon: FolderOpen, path: "/projects" },
];

const databaseNavItems = [
  { title: "Produits", icon: Package, path: "/products" },
  { title: "Ingrédients", icon: Apple, path: "/ingredients" },
  { title: "Emballages", icon: Box, path: "/packaging" },
  { title: "Stocks", icon: Warehouse, path: "/stocks" },
];

const productionNavItems = [
  { title: "Recettes", icon: ChefHat, path: "/recipes" },
  { title: "Tarification", icon: Calculator, path: "/pricing" },
];

const financialAnalysisNavItems = [
  { title: "Ventes", icon: TrendingUp, path: "/sales" },
  { title: "Frais professionnels", icon: Briefcase, path: "/expenses" },
  { title: "Cash-flow", icon: Wallet, path: "/cashflow" },
  { title: "TVA", icon: Receipt, path: "/tva" },
];

const productAnalysisNavItems = [
  { title: "Analyses", icon: BarChart3, path: "/analysis" },
  { title: "Sensibilité", icon: Activity, path: "/sensitivity" },
  { title: "Seuil rentabilité", icon: Crosshair, path: "/breakeven" },
  { title: "Stress Test", icon: ShieldAlert, path: "/stress-test" },
  { title: "Matrice BCG", icon: Target, path: "/matrix" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      navigate("/auth");
    }
  };

  const NavGroup = ({
    label,
    items,
  }: {
    label: string;
    items: typeof mainNavItems;
  }) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.path}
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">
              PilotFood
            </span>
            <span className="text-xs text-muted-foreground">
              Pilotage financier
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavGroup label="Navigation" items={mainNavItems} />
        <NavGroup label="Base de données" items={databaseNavItems} />
        <NavGroup label="Production" items={productionNavItems} />
        <NavGroup label="Analyse financière" items={financialAnalysisNavItems} />
        <NavGroup label="Analyse produits" items={productAnalysisNavItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
