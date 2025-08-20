import { useState } from "react";
import { User } from "@/lib/mockData";
import { useUsers, useUsersBySite, useUsersByRole } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, UserCheck } from "lucide-react";

interface TeamsProps {
  user: User;
}

export default function Teams({ user }: TeamsProps) {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  const { data: allUsers = [], isLoading } = useUsers();
  const { data: usersBySite = [] } = useUsersBySite(selectedSite);
  const { data: usersByRole = [] } = useUsersByRole(selectedRole);

  const sites = [...new Set(allUsers.map((u: any) => u.site))];
  const roles = [...new Set(allUsers.map((u: any) => u.role))];
  const disciplines = [...new Set(allUsers.map((u: any) => u.discipline))];

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'initiative_lead': 'bg-blue-500',
      'department_approver': 'bg-green-500',
      'site_tso_lead': 'bg-purple-500',
      'corporate_tso': 'bg-orange-500',
      'site_manager': 'bg-red-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  const UserCard = ({ userData }: { userData: any }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>{getUserInitials(userData.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{userData.fullName}</h3>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getRoleColor(userData.role)}>
                {userData.roleName}
              </Badge>
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                {userData.site}
              </Badge>
              <Badge variant="secondary">
                {userData.discipline}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="p-6">Loading team data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Manage teams and view user roles across sites</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sites.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="by-site">By Site</TabsTrigger>
          <TabsTrigger value="by-role">By Role</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {allUsers.map((userData: any) => (
              <UserCard key={userData.id} userData={userData} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter by Site</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site: string) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedSite && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Users at {selectedSite}</h3>
              <div className="grid gap-4">
                {usersBySite.map((userData: any) => (
                  <UserCard key={userData.id} userData={userData} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-role" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: string) => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedRole && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Users with role: {selectedRole.replace('_', ' ').toUpperCase()}
              </h3>
              <div className="grid gap-4">
                {usersByRole.map((userData: any) => (
                  <UserCard key={userData.id} userData={userData} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}