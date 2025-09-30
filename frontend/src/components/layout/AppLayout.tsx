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
          {/* Header */}
          <header className="h-10 border-b border-border bg-card px-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1" />
            </div>
            
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-2 py-1 h-7 hover:bg-muted"
                  >
                    <User className="h-3.5 w-3.5" />
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-semibold leading-none text-foreground">
                        {user.fullName}
                      </span>
                      <span className="text-2xs text-muted-foreground leading-none mt-0.5 font-medium">
                        {user.roleName}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-52 bg-popover border-border"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {user.fullName}
                      </span>
                      <span className="font-normal text-muted-foreground text-xs">
                     {user.site}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <div className="px-2 py-1.5">
                    <Badge variant="outline" className="text-2xs">
                      {user.site}
                    </Badge>
                    <Badge variant="outline" className="text-2xs ml-1">
                      {user.roleName}
                    </Badge>
                  </div> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onLogout} 
                    className="text-destructive text-sm hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto min-h-0 bg-background">
            <div className="p-1">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}