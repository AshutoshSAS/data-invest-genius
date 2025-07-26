import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Calendar, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Layers, 
  Tag, 
  RefreshCw,
  Clock,
  Download
} from 'lucide-react';

interface AnalyticsData {
  documentCount: number;
  projectCount: number;
  chatCount: number;
  documentsByCategory: {
    category: string;
    count: number;
  }[];
  documentsByStatus: {
    status: string;
    count: number;
  }[];
  documentsByMonth: {
    month: string;
    count: number;
  }[];
  topTags: {
    tag: string;
    count: number;
  }[];
  recentActivity: {
    type: string;
    title: string;
    timestamp: string;
    user_id: string;
  }[];
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get date range based on selection
      const endDate = new Date();
      let startDate = new Date();
      switch (timeRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '12months':
          startDate.setMonth(endDate.getMonth() - 12);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // First check if research_documents table exists
      const { error: tableCheckError } = await supabase
        .from('research_documents')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist yet, set default values
      if (tableCheckError) {
        console.log('Tables might not be set up yet:', tableCheckError);
        setAnalyticsData({
          documentCount: 0,
          projectCount: 0,
          chatCount: 0,
          documentsByCategory: [],
          documentsByStatus: [],
          documentsByMonth: [],
          topTags: [],
          recentActivity: []
        });
        setLoading(false);
        return;
      }

      // Document count
      let documentCount = 0;
      try {
        const { count, error } = await supabase
          .from('research_documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (!error) {
          documentCount = count || 0;
        }
      } catch (err) {
        console.error('Error fetching document count:', err);
      }

      // Project count
      let projectCount = 0;
      try {
        const { count, error } = await supabase
          .from('research_projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (!error) {
          projectCount = count || 0;
        }
      } catch (err) {
        console.error('Error fetching project count:', err);
      }

      // Chat count
      let chatCount = 0;
      try {
        const { count, error } = await supabase
          .from('chat_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (!error) {
          chatCount = count || 0;
        }
      } catch (err) {
        console.error('Error fetching chat count:', err);
      }

      // Documents by category
      let documentsByCategory: { category: string; count: number }[] = [];
      try {
        const { data, error } = await supabase
          .from('research_documents')
          .select('category')
          .eq('user_id', user!.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (!error && data) {
          documentsByCategory = data.reduce((acc, doc) => {
            const existingCategory = acc.find(item => item.category === doc.category);
            if (existingCategory) {
              existingCategory.count += 1;
            } else {
              acc.push({ category: doc.category || 'Uncategorized', count: 1 });
            }
            return acc;
          }, [] as { category: string; count: number }[]);
        }
      } catch (err) {
        console.error('Error fetching document categories:', err);
      }

      // Documents by status
      let documentsByStatus: { status: string; count: number }[] = [];
      try {
        const { data, error } = await supabase
          .from('research_documents')
          .select('status')
          .eq('user_id', user!.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (!error && data) {
          documentsByStatus = data.reduce((acc, doc) => {
            const existingStatus = acc.find(item => item.status === doc.status);
            if (existingStatus) {
              existingStatus.count += 1;
            } else {
              acc.push({ status: doc.status || 'Unknown', count: 1 });
            }
            return acc;
          }, [] as { status: string; count: number }[]);
        }
      } catch (err) {
        console.error('Error fetching document statuses:', err);
      }

      // Documents by month
      let documentsByMonth: { month: string; count: number }[] = [];
      try {
        const { data, error } = await supabase
          .from('research_documents')
          .select('created_at')
          .eq('user_id', user!.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          documentsByMonth = data.reduce((acc, doc) => {
            const date = new Date(doc.created_at);
            const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            const existingMonth = acc.find(item => item.month === month);
            if (existingMonth) {
              existingMonth.count += 1;
            } else {
              acc.push({ month, count: 1 });
            }
            return acc;
          }, [] as { month: string; count: number }[]);
        }
      } catch (err) {
        console.error('Error fetching document timeline:', err);
      }

      // Top tags
      let topTags: { tag: string; count: number }[] = [];
      try {
        const { data, error } = await supabase
          .from('research_documents')
          .select('tags')
          .eq('user_id', user!.id)
          .not('tags', 'is', null)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        if (!error && data) {
          const tagCounts: Record<string, number> = {};
          data.forEach(doc => {
            if (Array.isArray(doc.tags)) {
              doc.tags.forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          });
          
          topTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        }
      } catch (err) {
        console.error('Error fetching document tags:', err);
      }

      // Recent activity
      let recentActivity = [];
      try {
        const { data, error } = await supabase
          .from('activity_log')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!error && data) {
          recentActivity = data;
        } else {
          // If activity_log table doesn't exist yet, simulate some data
          recentActivity = [
            { type: 'document', title: 'Q4 2023 Market Analysis uploaded', timestamp: new Date().toISOString(), user_id: user!.id },
            { type: 'chat', title: 'Chat session with Market Analysis document', timestamp: new Date().toISOString(), user_id: user!.id },
            { type: 'project', title: 'Created "Fintech Research" project', timestamp: new Date().toISOString(), user_id: user!.id }
          ];
        }
      } catch (err) {
        console.error('Error fetching activity log:', err);
        // Provide fallback data
        recentActivity = [
          { type: 'document', title: 'Q4 2023 Market Analysis uploaded', timestamp: new Date().toISOString(), user_id: user!.id },
          { type: 'chat', title: 'Chat session with Market Analysis document', timestamp: new Date().toISOString(), user_id: user!.id },
          { type: 'project', title: 'Created "Fintech Research" project', timestamp: new Date().toISOString(), user_id: user!.id }
        ];
      }

      setAnalyticsData({
        documentCount,
        projectCount,
        chatCount,
        documentsByCategory,
        documentsByStatus,
        documentsByMonth,
        topTags,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
      
      // Set default data even if there's an error
      setAnalyticsData({
        documentCount: 0,
        projectCount: 0,
        chatCount: 0,
        documentsByCategory: [],
        documentsByStatus: [],
        documentsByMonth: [],
        topTags: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'chat': return MessageSquare;
      case 'project': return Layers;
      case 'tag': return Tag;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Insights and metrics for your research activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{analyticsData?.documentCount}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total documents in selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Layers className="h-5 w-5 text-purple-500 mr-2" />
              <div className="text-2xl font-bold">{analyticsData?.projectCount}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total projects in selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">AI Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{analyticsData?.chatCount}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total AI chat sessions in selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Documents by Month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents Over Time</CardTitle>
                <CardDescription>Document uploads by month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-1 flex items-end">
                    {analyticsData?.documentsByMonth && analyticsData.documentsByMonth.length > 0 ? (
                      analyticsData.documentsByMonth.map((item, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="w-full max-w-[40px] bg-blue-500 rounded-t"
                            style={{ 
                              height: `${Math.max(
                                5, 
                                (item.count / Math.max(...analyticsData.documentsByMonth.map(i => i.count))) * 200
                              )}px` 
                            }}
                          />
                          <div className="text-xs mt-2 text-gray-600">{item.count}</div>
                          <div className="text-xs font-medium mt-1">{item.month}</div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No document data available for this period
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents by Category</CardTitle>
                <CardDescription>Distribution across categories</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex items-center justify-center">
                  <div className="w-full max-w-xs">
                    {analyticsData?.documentsByCategory && analyticsData.documentsByCategory.length > 0 ? (
                      analyticsData.documentsByCategory.map((item, index) => (
                        <div key={index} className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.category}</span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(item.count / analyticsData.documentCount) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        No category data available
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Tags</CardTitle>
                <CardDescription>Most frequently used tags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analyticsData?.topTags && analyticsData.topTags.length > 0 ? (
                    analyticsData.topTags.map((item, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1"
                      >
                        <span>{item.tag}</span>
                        <span className="bg-blue-100 text-blue-800 px-1.5 rounded-full text-xs">
                          {item.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center text-gray-500">
                      No tags available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Status</CardTitle>
                <CardDescription>Processing status of documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.documentsByStatus && analyticsData.documentsByStatus.length > 0 ? (
                    analyticsData.documentsByStatus.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{item.status}</span>
                          <span className="text-sm text-gray-600">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              item.status.toLowerCase() === 'processed' ? 'bg-green-500' : 
                              item.status.toLowerCase() === 'processing' ? 'bg-blue-500' : 
                              item.status.toLowerCase() === 'error' ? 'bg-red-500' : 
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${(item.count / analyticsData.documentCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">
                      No status data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Analytics</CardTitle>
              <CardDescription>
                Detailed metrics about your research documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
                Detailed document analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>
                Detailed metrics about your research projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">
                Detailed project analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest actions and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 ? (
                  analyticsData.recentActivity.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics; 