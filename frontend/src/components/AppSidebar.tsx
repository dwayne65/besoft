import { LayoutDashboard, Users, UserPlus, Upload, BarChart3, CreditCard, LogOut, Wallet, Calendar, DollarSign, Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Groups', url: '/groups', icon: Users },
  { title: 'Members', url: '/members', icon: UserPlus },
  { title: 'My Wallet', url: '/member-portal', icon: Wallet, roles: ['member'] },
  { title: 'Wallets', url: '/wallets', icon: Wallet, roles: ['super_admin', 'group_admin', 'group_user'] },
  { title: 'Monthly Deductions', url: '/deductions', icon: Calendar },
  { title: 'Withdrawals', url: '/withdrawals', icon: DollarSign },
  { title: 'Group Policy', url: '/group-policy', icon: Shield, roles: ['super_admin', 'group_admin'] },
  { title: 'Excel Upload', url: '/upload', icon: Upload },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Payments', url: '/payments', icon: CreditCard },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { logout, user } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-sidebar-primary-foreground">
            {open ? 'Maisha App' : 'MA'}
          </h1>
          {open && user && (
            <p className="text-sm text-sidebar-foreground/70 mt-1">
              {user.name} ({user.role})
            </p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // Filter items based on user role if roles are specified
                if (item.roles && user && !item.roles.includes(user.role)) {
                  return null;
                }
                
                return (
                <SidebarMenuItem key={item.title}>
                  {open ? (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                          >
                            <item.icon className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {open && 'Logout'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
