import { Search, Plus, Settings, User, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { MobileNav } from './MobileNav';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <MobileNav />
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">RI</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">Research Intelligence</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Research Platform</p>
          </div>
        </div>

        {/* Navigation - Hidden on mobile, shown on desktop */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link 
            to="/dashboard" 
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/dashboard' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/documents" 
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/documents' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Documents
          </Link>
          <Link 
            to="/projects" 
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/projects' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Projects
          </Link>
          <Link 
            to="/upload" 
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/upload' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upload
          </Link>
          <Link 
            to="/chat" 
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/chat' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Chat
          </Link>
        </nav>

        {/* Search Bar - Hidden on mobile, shown on desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search research, documents, tags..."
              className="pl-10 bg-muted/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* + Research button - Hidden on mobile */}
          <div className="hidden sm:block">
            <Link to="/projects">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                + Project
              </Button>
            </Link>
          </div>

          {/* Notifications - Hidden on mobile */}
          <div className="hidden sm:block">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>
          </div>

          {/* Settings - Hidden on mobile */}
          <div className="hidden sm:block">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {profile?.full_name || user?.email || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {profile?.role || 'researcher'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/profile">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              </Link>
              <Link to="/teams">
                <DropdownMenuItem>Team Management</DropdownMenuItem>
              </Link>
              <DropdownMenuItem>API Keys</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}