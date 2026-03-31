import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, BookOpen, Users, UserCheck, Settings, BarChart3,
  ShieldCheck, LogOut, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { role, user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const allItems = [
    { title: 'Tableau de bord', url: '/', icon: LayoutDashboard, roles: ['administrateur', 'responsable', 'simple_utilisateur'] },
    { title: 'Formations', url: '/formations', icon: BookOpen, roles: ['administrateur', 'simple_utilisateur'] },
    { title: 'Participants', url: '/participants', icon: Users, roles: ['administrateur', 'simple_utilisateur'] },
    { title: 'Formateurs', url: '/formateurs', icon: UserCheck, roles: ['administrateur', 'simple_utilisateur'] },
    { title: 'Référentiels', url: '/referentiels', icon: Settings, roles: ['administrateur'] },
    { title: 'Utilisateurs', url: '/utilisateurs', icon: ShieldCheck, roles: ['administrateur'] },
    { title: 'Statistiques', url: '/statistiques', icon: BarChart3, roles: ['administrateur', 'responsable'] },
  ];

  const items = allItems.filter(item => role && item.roles.includes(role));

  const roleLabels: Record<string, string> = {
    administrateur: 'Administrateur',
    responsable: 'Responsable',
    simple_utilisateur: 'Utilisateur',
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-3 py-4">
            <GraduationCap className="h-6 w-6 text-sidebar-primary shrink-0" />
            {!collapsed && (
              <div>
                <p className="font-bold text-sm text-sidebar-foreground">Excellent Training</p>
                <p className="text-xs text-sidebar-foreground/60">Green Building</p>
              </div>
            )}
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-3 space-y-2">
          {!collapsed && (
            <div className="text-xs text-sidebar-foreground/70">
              <p className="font-medium truncate">{user?.email}</p>
              <p className="text-sidebar-primary">{role ? roleLabels[role] : ''}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
