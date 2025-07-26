import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Home, FileText, Database, MessageSquare, Upload, Building, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const mobileNavigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Projects", url: "/projects", icon: Building },
  { title: "Research", url: "/research", icon: Database },
  { title: "AI Assistant", url: "/chat", icon: MessageSquare, badge: "New" },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "Teams", url: "/teams", icon: Users },
  { title: "Profile", url: "/profile", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="md:hidden"
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RI</span>
              </div>
              <span className="font-semibold">Research Intelligence</span>
            </div>
          </div>
          
          <nav className="p-2 space-y-1">
            {mobileNavigationItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive(item.url) && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>AI Assistant Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 