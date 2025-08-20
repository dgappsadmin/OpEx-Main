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
    title: "My Initiatives",
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
  // {
  //   title: "Timeline Tracking",
  //   url: "/timeline",
  //   icon: Calendar,
  //   group: "Tracking"
  // },
  {
    title: "Timeline Tracker",
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
    title: "Monthly Reports",
    url: "/reports",
    icon: TrendingUp,
    group: "Tracking"
  },
  {
    title: "Team Management",
    url: "/teams",
    icon: Users,
    group: "Management"
  }
  // {
  //   title: "Initiative Closure",
  //   url: "/closure",
  //   icon: XCircle,
  //   group: "Management"
  // }
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
  
  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.title === "New Initiative") {
      return user?.role === "STLD";
    }
    return true;
  });
  
  const groupedItems = groupItems(filteredNavigationItems);
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath === path) return true;
    return false;
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary-hover" 
      : "hover:bg-muted text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        {/* Logo Section - Optimized for 14-inch laptops */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            {!isCollapsed ? (
              <div className="flex items-center">
                <img
                  src={dnlLogo}
                  alt="DNL Logo"
                  className="h-8 w-auto"
                />
                <div className="ml-3">
                  <div className="text-sm font-semibold text-foreground">OpEx Hub</div>
                  <div className="text-xs text-muted-foreground">Operational Excellence</div>
                </div>
              </div>
            ) : (
              <img
                src={dnlLogo}
                alt="DNL Logo"
                className="h-8 w-auto"
              />
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName} className="py-2">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-2xs laptop-14:text-xs font-semibold text-muted-foreground px-3">
                {groupName}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="py-2 text-sm">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={getNavCls({ isActive: isActive(item.url) })}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
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