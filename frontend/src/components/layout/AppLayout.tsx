import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  fullName: string;
  site: string;
  discipline: string;
  role: string;
  roleName: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export function AppLayout({ children, user, onLogout }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar user={user} />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Enhanced modern design for 14-inch laptops */}
          <header className="h-10 border-b border-border/60 bg-gradient-to-r from-card to-card/95 backdrop-blur-sm px-2 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:bg-gradient-to-r hover:from-muted/50 hover:to-accent/30 rounded-md p-1 hover:scale-105 hover:shadow-sm" />
            </div>
            
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-2 py-1 h-7 hover:bg-gradient-to-r hover:from-muted/50 hover:to-accent/30 transition-all duration-300 hover:shadow-sm hover:scale-[1.02] group border border-transparent hover:border-border/30"
                  >
                    <div className="relative">
                      <User className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-sm"></div>
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-semibold leading-none bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text transition-all duration-300 group-hover:tracking-wide">
                        {user.fullName}
                      </span>
                      <span className="text-2xs text-muted-foreground/90 leading-none mt-0.5 font-medium transition-all duration-300 group-hover:text-muted-foreground">
                        {user.roleName}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-52 bg-gradient-to-b from-popover to-popover/95 backdrop-blur-sm border-border/60 shadow-xl"
                >
                  <DropdownMenuLabel className="bg-gradient-to-r from-muted/30 to-transparent">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text">
                        {user.fullName}
                      </span>
                      <span className="font-normal text-muted-foreground/90 text-xs">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <div className="px-2 py-1.5 bg-gradient-to-r from-muted/20 to-transparent">
                    <Badge 
                      variant="outline" 
                      className="text-2xs border-border/60 bg-gradient-to-r from-background/50 to-background/30 hover:from-accent/20 hover:to-accent/10 transition-all duration-300"
                    >
                      {user.site}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-2xs ml-1 border-border/60 bg-gradient-to-r from-background/50 to-background/30 hover:from-accent/20 hover:to-accent/10 transition-all duration-300"
                    >
                      {user.roleName}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem 
                    onClick={onLogout} 
                    className="text-destructive text-sm hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 transition-all duration-300 group"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5 transition-all duration-300 group-hover:scale-110" />
                    <span className="transition-all duration-300 group-hover:tracking-wide">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content - Enhanced with subtle background gradient */}
          <main className="flex-1 overflow-y-auto min-h-0 bg-gradient-to-br from-background to-background/98">
            <div className="p-1">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}