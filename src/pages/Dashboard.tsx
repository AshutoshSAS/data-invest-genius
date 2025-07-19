import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Database,
  Upload,
  Tag,
  BarChart3,
  Clock,
  Users,
  Bot
} from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function Dashboard() {
  const stats = [
    {
      title: "Research Documents",
      value: "2,847",
      change: "+12%",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "AI Conversations",
      value: "156",
      change: "+23%", 
      icon: MessageSquare,
      color: "text-green-600"
    },
    {
      title: "Insights Generated",
      value: "94",
      change: "+8%",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Data Sources",
      value: "18",
      change: "+2",
      icon: Database,
      color: "text-orange-600"
    }
  ];

  const recentActivity = [
    {
      type: "upload",
      title: "Investment Report Q4 2024 uploaded",
      time: "2 hours ago",
      user: "Sarah Chen",
      tags: ["Q4", "Investment", "Analysis"]
    },
    {
      type: "chat",
      title: "AI analysis on fintech trends requested",
      time: "4 hours ago", 
      user: "Mike Johnson",
      tags: ["Fintech", "Trends", "AI"]
    },
    {
      type: "insight",
      title: "Market correlation insights generated",
      time: "6 hours ago",
      user: "AI Assistant",
      tags: ["Market", "Correlation", "Insights"]
    },
    {
      type: "tag",
      title: "New research tagged: 'Sustainable Finance'",
      time: "8 hours ago",
      user: "Lisa Wang",
      tags: ["Sustainable", "Finance", "ESG"]
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload": return Upload;
      case "chat": return MessageSquare;
      case "insight": return BarChart3;
      case "tag": return Tag;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Research Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered research intelligence and analysis platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
          <Button className="gap-2 gradient-primary">
            <Bot className="h-4 w-4" />
            Start AI Analysis
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 shadow-research hover:shadow-elegant transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-sm text-success mt-1">{stat.change} from last month</p>
              </div>
              <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <Card className="p-6 h-fit shadow-research">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Live
              </Badge>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={index} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Users className="h-3 w-3" />
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{activity.time}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {activity.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* AI Chat Interface */}
        <div className="lg:col-span-2">
          <div className="h-[600px]">
            <ChatInterface />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 shadow-research">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Upload className="h-6 w-6" />
            <span>Upload Research</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <MessageSquare className="h-6 w-6" />
            <span>Ask AI Assistant</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <BarChart3 className="h-6 w-6" />
            <span>Generate Insights</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}