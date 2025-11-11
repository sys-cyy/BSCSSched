import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminLoginDialog } from "@/components/AdminLoginDialog";
import { PublicSchedule } from "@/pages/PublicSchedule";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { AdminSchedule } from "@/pages/AdminSchedule";
import { ForceAnnounce } from "@/pages/ForceAnnounce";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // Check if admin is logged in from server session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        if (data.isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
      }
    };
    checkAuth();
  }, []);

  const handleAdminLogin = async (password: string) => {
    try {
      await apiRequest("POST", "/api/auth/login", { password });
      setIsAdmin(true);
      setLoginDialogOpen(false);
      setLocation("/admin");
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid password",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setIsAdmin(false);
      setLocation("/");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // Still log out on frontend even if server call fails
      setIsAdmin(false);
      setLocation("/");
    }
  };

  // Redirect to login if accessing admin routes without auth
  useEffect(() => {
    if (location.startsWith("/admin") && !isAdmin) {
      setLocation("/");
      setLoginDialogOpen(true);
    }
  }, [location, isAdmin, setLocation]);

  // Admin layout with sidebar
  if (isAdmin && location.startsWith("/admin")) {
    const sidebarStyle = {
      "--sidebar-width": "280px",
      "--sidebar-width-icon": "4rem",
    };

    return (
      <>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar onLogout={handleLogout} />
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/schedule" component={AdminSchedule} />
                <Route path="/admin/announce" component={ForceAnnounce} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </SidebarProvider>
        <AdminLoginDialog
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
          onLogin={handleAdminLogin}
        />
      </>
    );
  }

  // Public layout
  return (
    <>
      <Switch>
        <Route path="/">
          <PublicSchedule onAdminLogin={() => setLoginDialogOpen(true)} />
        </Route>
        <Route component={NotFound} />
      </Switch>
      <AdminLoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLogin={handleAdminLogin}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
