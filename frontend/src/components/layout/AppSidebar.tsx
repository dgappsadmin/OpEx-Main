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
      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-md border-l-2 border-primary-foreground/20 hover:from-primary/95 hover:to-primary/85 transition-all duration-300 ease-out transform hover:translate-x-0.5" 
      : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-accent/30 text-muted-foreground hover:text-foreground transition-all duration-300 ease-out hover:shadow-sm hover:border-l-2 hover:border-primary/30 hover:transform hover:translate-x-0.5";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-card to-card/95 border-r border-border/60 backdrop-blur-sm">
        {/* Logo Section - Enhanced with subtle gradient */}
        <div className="p-2 border-b border-border/60 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {!isCollapsed ? (
              <div className="flex items-center group transition-all duration-300 hover:scale-[1.02]">
                <div className="relative">
                  <img
                    src={dnlLogo}
                    alt="DNL Logo"
                    className="h-5 w-auto transition-all duration-300 group-hover:brightness-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>
                </div>
                <div className="ml-2">
                  <div className="text-xs font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    OpEx Hub
                  </div>
                  <div className="text-2xs text-muted-foreground/90 leading-tight font-medium">
                    Operational Excellence
                  </div>
                </div>
              </div>
            ) : (
              <div className="group transition-all duration-300 hover:scale-110 relative">
                <img
                  src={dnlLogo}
                  alt="DNL Logo"
                  className="h-5 w-auto transition-all duration-300 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups - Enhanced with modern styling */}
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName} className="py-1.5">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-2xs font-bold text-muted-foreground/80 px-3 py-1 tracking-wider uppercase bg-gradient-to-r from-muted/30 to-transparent border-l-2 border-primary/20">
                {groupName}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="py-1.5 text-xs h-8 mx-1 rounded-md group">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={getNavCls({ isActive: isActive(item.url) })}
                      >
                        <div className="relative">
                          <item.icon className={`h-4 w-4 transition-all duration-300 ${
                            isActive(item.url) 
                              ? "drop-shadow-sm" 
                              : "group-hover:scale-110 group-hover:drop-shadow-sm"
                          }`} />
                          {/* Enhanced icon glow effect for active state */}
                          {isActive(item.url) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/20 to-transparent rounded-full blur-sm"></div>
                          )}
                        </div>
                        {!isCollapsed && (
                          <span className={`text-xs font-medium transition-all duration-300 ${
                            isActive(item.url) 
                              ? "tracking-wide" 
                              : "group-hover:tracking-wide"
                          }`}>
                            {item.title}
                          </span>
                        )}
                        {/* Active state indicator */}
                        {isActive(item.url) && (
                          <div className="ml-auto">
                            <div className="w-1.5 h-1.5 bg-primary-foreground/60 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        
        {/* Enhanced bottom gradient overlay */}
        <div className="mt-auto h-8 bg-gradient-to-t from-card/80 to-transparent"></div>
      </SidebarContent>
    </Sidebar>
  );
}