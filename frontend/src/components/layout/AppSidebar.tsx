import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  BarChart3,
  FileText,
  Calendar,
  Target,
  Settings,
  PlusCircle,
  ClipboardCheck,
  Users,
  TrendingUp,
  XCircle,
  Clock,
  BarChart2
} from "lucide-react";
import dnlLogo from "@/assets/dnl-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    group: "Overview"
  },
  {
    title: "New Initiative",
    url: "/initiative/new",
    icon: PlusCircle,
    group: "Initiatives"
  },
  {
    title: "List of Initiatives",
    url: "/initiatives",
    icon: FileText,
    group: "Initiatives"
  },
  {
    title: "Workflow Management",
    url: "/workflow",
    icon: ClipboardCheck,
    group: "Initiatives"
  },
  {
    title: "Activity Timeline Tracker",
    url: "/timeline-tracker",
    icon: Clock,
    group: "Tracking"
  },
  {
    title: "Monthly Monitoring",
    url: "/monthly-monitoring",
    icon: BarChart2,
    group: "Tracking"
  },
  {
    title: "KPI Monitoring",
    url: "/kpi",
    icon: Target,
    group: "Tracking"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: TrendingUp,
    group: "Tracking"
  },
];

const groupItems = (items: typeof navigationItems) => {
  const grouped: Record<string, typeof navigationItems> = {};
  items.forEach(item => {
    if (!grouped[item.group]) {
      grouped[item.group] = [];
    }
    grouped[item.group].push(item);
  });
  return grouped;
};

interface AppSidebarProps {
  user?: { role?: string };
}

export function AppSidebar({ user }: AppSidebarProps = {}) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // All users can access all navigation items - no role restrictions
  const filteredNavigationItems = navigationItems;
  
  const groupedItems = groupItems(filteredNavigationItems);
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath === path) return true;
    return false;
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-semibold" 
      : "text-muted-foreground hover:text-foreground hover:bg-muted";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        {/* Logo Section */}
        <div className="p-2 border-b border-border">
          <div className="flex items-center gap-2">
            {!isCollapsed ? (
              <div className="flex items-center">
                <img
                  src={dnlLogo}
                  alt="DNL Logo"
                  className="h-5 w-auto"
                />
                <div className="ml-2">
                  <div className="text-xs font-bold text-foreground">
                    OpEx Hub
                  </div>
                  <div className="text-2xs text-muted-foreground leading-tight font-medium">
                    Operational Excellence
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={dnlLogo}
                alt="DNL Logo"
                className="h-5 w-auto"
              />
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName} className="py-1.5">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-2xs font-bold text-muted-foreground px-3 py-1 uppercase">
                {groupName}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="py-1.5 text-xs h-8 mx-1 rounded-md">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={getNavCls({ isActive: isActive(item.url) })}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <span className="text-xs font-medium">
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}