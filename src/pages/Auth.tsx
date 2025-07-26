import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Brain, BarChart3, FileText, MessageSquare } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, profile, loading } = useAuth();
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const createProfileManually = async () => {
    if (!user) return;
    
    setCreatingProfile(true);
    setProfileError(null);
    
    try {
      console.log('Manually creating profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          role: 'researcher',
          team_id: null,
          avatar_url: null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Manual profile creation error:', error);
        setProfileError(error.message);
      } else {
        console.log('Manual profile creation successful:', data);
        window.location.reload();
      }
    } catch (err) {
      console.error('Manual profile creation exception:', err);
      setProfileError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreatingProfile(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Show debug info if user is logged in but no profile
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Profile Setup Required</h2>
          <p className="text-muted-foreground">
            User logged in but profile not found. This might be a database issue.
          </p>
          <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Status:</strong> Profile creation failed</p>
          </div>
          
          {profileError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              <strong>Error:</strong> {profileError}
            </div>
          )}
          
          <div className="space-x-2">
            <button 
              onClick={createProfileManually}
              disabled={creatingProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creatingProfile ? 'Creating...' : 'Create Profile Manually'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Retry Auto
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if user is already logged in
  if (user && profile) {
    console.log('User already logged in, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Brain className="h-8 w-8 mr-3" />
              <h1 className="text-3xl font-bold">Data Invest Genius</h1>
            </div>
            <p className="text-blue-100 text-lg">
              AI-powered research management platform for investment teams
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Smart Document Processing</h3>
                <p className="text-blue-100">
                  Upload research documents and get instant AI-powered analysis, summaries, and insights.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">RAG-Powered Intelligence</h3>
                <p className="text-blue-100">
                  Ask questions about your research and get contextual answers with source citations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Advanced Analytics</h3>
                <p className="text-blue-100">
                  Track research trends, team performance, and investment insights with comprehensive dashboards.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Team Collaboration</h3>
                <p className="text-blue-100">
                  Share insights, collaborate on research, and maintain team knowledge in one secure platform.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-500/20 rounded-lg">
            <p className="text-blue-100 text-sm">
              "This platform has revolutionized how our investment team processes and analyzes research. 
              The AI insights are incredibly valuable for our decision-making process."
            </p>
            <p className="text-blue-200 text-sm mt-2 font-medium">
              — Senior Investment Analyst
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth; 