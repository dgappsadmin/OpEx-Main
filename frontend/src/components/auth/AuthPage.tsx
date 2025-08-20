import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const sites = [
  { code: "NDS", name: "NDS" },
  { code: "HSD1", name: "HSD1" },
  { code: "HSD2", name: "HSD2" },
  { code: "HSD3", name: "HSD3" },
  { code: "DHJ", name: "DHJ" },
  { code: "APL", name: "APL" },
  { code: "TCD", name: "TCD" }
];

const disciplines = [
  { code: "OP", name: "Operation" },
  { code: "EG", name: "Engineering & Utility" },
  { code: "EV", name: "Environment" },
  { code: "SF", name: "Safety" },
  { code: "QA", name: "Quality" },
  { code: "OT", name: "Others" }
];

const roles = [
  { code: "IL", name: "Initiative Lead" },
  { code: "STLD", name: "Site TSD Lead" },
  { code: "EH", name: "Engineering Head" },
  { code: "CTSD", name: "Corp TSD" }
];

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function AuthPage({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    site: "",
    discipline: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        console.log('Attempting login with:', formData.email);
        // Real API login
        const result = await login(formData.email, formData.password);
        console.log('Login result:', result);
        
        if (result.success) {
          console.log('AuthPage: Login successful - navigation should happen automatically');
          toast({
            title: "Login Successful",
            description: "Welcome back to OpEx Hub!",
          });
          // Clear form data after successful login
          setFormData(prev => ({ ...prev, password: '' }));
          
          // Navigation happens automatically in AuthContext via useNavigate
        } else {
          console.log('Login failed with error:', result.error);
          toast({
            title: "Login Failed",
            description: result.error || "Invalid credentials",
            variant: "destructive"
          });
        }
      } else {
        // Real API signup
        if (!formData.fullName || !formData.site || !formData.discipline || !formData.role) {
          toast({
            title: "Signup Failed",
            description: "Please fill in all required fields.",
            variant: "destructive"
          });
          return;
        }

        const userData = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          site: formData.site,
          discipline: formData.discipline,
          role: formData.role,
          roleName: roles.find(r => r.code === formData.role)?.name || ""
        };

        const result = await register(userData);
        
        if (result.success) {
          toast({
            title: "Signup Successful",
            description: "Account created successfully! Please sign in.",
          });
          setIsLogin(true); // Switch to login tab
        } else {
          toast({
            title: "Signup Failed",
            description: result.error || "Registration failed",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-white relative overflow-hidden">
      {/* Enhanced Chemical Background */}
      <div className="absolute inset-0">
        {/* Glassmorphism Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-white/40 to-blue-50/30"></div>
        
        {/* Animated Chemical Molecules */}
        <div className="absolute inset-0">
          {/* Large molecules */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-200/40 rounded-full blur-sm animate-float-molecule"></div>
          <div className="absolute top-3/4 right-1/4 w-12 h-12 bg-blue-300/30 rounded-full blur-sm animate-float-molecule-delayed"></div>
          <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-blue-100/50 rounded-full blur-sm animate-float-molecule-slow"></div>
          
          {/* Medium molecules */}
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-blue-400/30 rounded-full blur-sm animate-float-molecule"></div>
          <div className="absolute bottom-1/4 right-1/2 w-10 h-10 bg-blue-200/40 rounded-full blur-sm animate-float-molecule-delayed"></div>
          <div className="absolute top-1/6 left-1/2 w-6 h-6 bg-blue-300/35 rounded-full blur-sm animate-float-molecule-slow"></div>
          
          {/* Small molecules */}
          <div className="absolute top-2/3 left-1/6 w-4 h-4 bg-blue-500/25 rounded-full blur-sm animate-float-molecule"></div>
          <div className="absolute bottom-1/2 right-1/6 w-5 h-5 bg-blue-200/30 rounded-full blur-sm animate-float-molecule-delayed"></div>
          <div className="absolute top-1/3 right-2/3 w-3 h-3 bg-blue-400/20 rounded-full blur-sm animate-float-molecule-slow"></div>
          
          {/* Molecular bonds/connections */}
          <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent rotate-45 animate-pulse-bond"></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-200/40 to-transparent -rotate-12 animate-pulse-bond-delayed"></div>
          <div className="absolute top-2/3 left-1/2 w-28 h-0.5 bg-gradient-to-r from-transparent via-blue-400/25 to-transparent rotate-12 animate-pulse-bond"></div>
          <div className="absolute bottom-1/2 left-1/6 w-20 h-0.5 bg-gradient-to-r from-transparent via-blue-300/35 to-transparent -rotate-45 animate-pulse-bond-delayed"></div>
        </div>
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 backdrop-blur-[0.5px] bg-white/10"></div>
      </div>
      
      {/* Main Login Container with Glassmorphism */}
      <div className="relative w-full max-w-lg mx-4 z-10">
        <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/50 animate-fade-in">
          <CardHeader className="text-center pb-8">
            {/* Logo Section */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative animate-slide-down">
                <img
                  src="https://www.godeepak.com/wp-content/uploads/2024/01/DNL-Logo.png"
                  alt="DNL Logo"
                  className="h-16 w-auto"
                />
              </div>
            </div>
            
            {/* Title Section */}
            <div className="mb-6 animate-slide-up">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">OpEx Hub</h1>
              <p className="text-blue-600 font-medium">Operational Excellence Platform</p>
              <div className="w-16 h-0.5 bg-blue-500 mx-auto mt-4"></div>
            </div>
            
            <CardTitle className="text-2xl text-gray-900 mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isLogin 
                ? "Enter your credentials to access OpEx Hub" 
                : "Fill in your details to create your account"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="animate-fade-in-delayed">
            <Tabs value={isLogin ? "login" : "signup"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLogin(true)}
                  className="text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsLogin(false)}
                  className="text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6">
                <TabsContent value="login" className="space-y-6 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                      />
                    </div>
                  </div>

              
                </TabsContent>

                <TabsContent value="signup" className="space-y-5 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                        <Input
                          id="fullName"
                          placeholder="Deep Sharma"
                          className="pl-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="sharma@godeepak.com"
                          className="pl-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="site" className="text-gray-700 font-medium text-sm">Site *</Label>
                      <Select value={formData.site} onValueChange={(value) => handleInputChange("site", value)}>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200">
                          <SelectValue placeholder="Site" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          {sites.map((site) => (
                            <SelectItem key={site.code} value={site.code} className="hover:bg-blue-50">
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discipline" className="text-gray-700 font-medium text-sm">Discipline *</Label>
                      <Select value={formData.discipline} onValueChange={(value) => handleInputChange("discipline", value)}>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200">
                          <SelectValue placeholder="Discipline" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          {disciplines.map((discipline) => (
                            <SelectItem key={discipline.code} value={discipline.code} className="hover:bg-blue-50">
                              {discipline.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-700 font-medium text-sm">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-colors duration-200">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                          {roles.map((role) => (
                            <SelectItem key={role.code} value={role.code} className="hover:bg-blue-50">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-[1.02] shadow-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      {isLogin ? "Sign In" : "Create Account"}
                    </div>
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}