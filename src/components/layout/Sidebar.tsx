import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Database, 
  MessageSquare, 
  Tags, 
  BarChart3, 
  Upload,
  FolderOpen,
  Bot,
  Bookmark,
  TrendingUp,
  Archive,
  Users,
  Settings,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from "lucide-react";

interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationItems: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Documents", url: "/documents", icon: FileText },
      { title: "Projects", url: "/projects", icon: Building },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Research Tools",
    items: [
      { title: "AI Chat", url: "/chat", icon: MessageSquare },
      { title: "Upload Documents", url: "/upload", icon: Upload },
      { title: "Teams", url: "/teams", icon: Users },
    ]
  },
  {
    title: "Settings",
    items: [
      { title: "Profile", url: "/profile", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={cn(
      "hidden md:flex flex-col bg-card border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          <Bot className="h-4 w-4" />
          {!collapsed && <span className="ml-2">AI Research Bot</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {navigationItems.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive(item.url) && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            
            {!collapsed && <Separator className="mt-4" />}
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t">
        <div className={cn(
          "flex items-center gap-3 text-sm text-muted-foreground",
          collapsed && "justify-center"
        )}>
          <div className="w-2 h-2 bg-success rounded-full animate-pulse-slow" />
          {!collapsed && <span>AI Assistant Active</span>}
        </div>
      </div>
    </div>
  );
}