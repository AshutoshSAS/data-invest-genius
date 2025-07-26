import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";
import Teams from "./pages/Teams";
import Upload from "./pages/Upload";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Landing page wrapper that redirects to dashboard if logged in
const LandingWrapper = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<LandingWrapper />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Dashboard />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/documents" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Documents />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/projects" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Projects />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Analytics />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Profile />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/teams" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Teams />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/upload" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Upload />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Chat />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
