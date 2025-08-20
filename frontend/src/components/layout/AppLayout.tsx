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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar user={user} />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Compact for 14-inch laptops */}
          <header className="h-12 border-b border-border bg-card px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                <Input 
                  placeholder="Search initiatives..." 
                  className="pl-8 w-56 text-xs h-8"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full text-xs text-primary-foreground flex items-center justify-center">
                  3
                </span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-8">
                    <User className="h-3.5 w-3.5" />
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-medium leading-none">{user.fullName}</span>
                      <span className="text-2xs text-muted-foreground leading-none mt-0.5">{user.roleName}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm">{user.fullName}</span>
                      <span className="font-normal text-muted-foreground text-xs">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1">
                    <Badge variant="outline" className="text-2xs">{user.site}</Badge>
                    <Badge variant="outline" className="text-2xs ml-1">{user.roleName}</Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive text-sm">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content - Optimized spacing for 14-inch laptops */}
          <main className="flex-1 p-3 overflow-auto">
            <div className="container mx-auto max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}