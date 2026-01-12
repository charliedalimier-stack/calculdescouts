import { Link, useLocation } from "react-router-dom";
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
  Settings,
  Activity,
  Crosshair,
  ShieldAlert,
  Warehouse,
  Receipt,
  Globe,
} from "lucide-react";
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

const analysisNavItems = [
  { title: "Ventes", icon: TrendingUp, path: "/sales" },
  { title: "Cash-flow", icon: Wallet, path: "/cashflow" },
  { title: "TVA", icon: Receipt, path: "/tva" },
  { title: "Analyses", icon: BarChart3, path: "/analysis" },
  { title: "Sensibilité", icon: Activity, path: "/sensitivity" },
  { title: "Seuil rentabilité", icon: Crosshair, path: "/breakeven" },
  { title: "Stress Test", icon: ShieldAlert, path: "/stress-test" },
  { title: "Matrice BCG", icon: Target, path: "/matrix" },
];

export function AppSidebar() {
  const location = useLocation();

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
        <NavGroup label="Analyses" items={analysisNavItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
