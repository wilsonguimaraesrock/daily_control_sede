import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import Index from '@/pages/Index';
import LoginForm from '@/components/LoginForm';
import FirstTimePasswordChange from '@/components/FirstTimePasswordChange';
import { OrganizationSelector } from '@/components/OrganizationSelector';
import { useState, useEffect, Component, ReactNode } from 'react';
import { getOrganizationTitle } from '@/utils/permissions';
import './App.css';

const queryClient = new QueryClient();

// Simple Error Boundary for iPad debugging
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('iPad Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isIPad = navigator.platform.includes('iPad') || 
                     (navigator.platform.includes('Mac') && navigator.maxTouchPoints > 0);
      
      return (
        <div className="h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card backdrop-blur-sm border border-border rounded-lg p-6 text-center">
            <div className="text-destructive text-lg font-bold mb-4">
              {isIPad ? '🍎 iPad Error Detected' : '❌ Application Error'}
            </div>
            <div className="text-foreground text-sm mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            {isIPad && (
              <div className="text-muted-foreground text-xs mb-4">
                <strong>iPad Debug Info:</strong><br/>
                Platform: {navigator.platform}<br/>
                User Agent: {navigator.userAgent.substring(0, 50)}...<br/>
                Touch Points: {navigator.maxTouchPoints}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component with iPad-specific styling
function LoadingScreen() {
  const [loadingTime, setLoadingTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-screen w-full bg-background text-foreground flex items-center justify-center prevent-white-screen">
      <div className="text-center">
        <div className="text-foreground text-xl mb-4">Carregando...</div>
        <div className="text-muted-foreground text-sm">
          {loadingTime > 10 && "Carregamento está demorando mais que o esperado..."}
          {loadingTime > 20 && (
            <div className="mt-2">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded text-sm"
              >
                Recarregar Página
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, needsPasswordChange, loading, currentOrganization } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  
  // Check for debug mode in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      setDebugMode(true);
    }
  }, []);
  
  // Update page title based on organization
  useEffect(() => {
    const title = getOrganizationTitle(currentOrganization);
    document.title = title;
  }, [currentOrganization]);
  
  // iPad detection and logging
  useEffect(() => {
    const isIPad = navigator.platform.includes('iPad') || 
                   (navigator.platform.includes('Mac') && navigator.maxTouchPoints > 0);
    
    if (isIPad) {
      // iPad detected - optimizations can be added here if needed
    }
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const content = (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            currentUser ? (
              needsPasswordChange ? <Navigate to="/change-password" replace /> : <Navigate to="/" replace />
            ) : <LoginForm />
          } 
        />
        <Route 
          path="/change-password" 
          element={
            currentUser ? (
              needsPasswordChange ? <FirstTimePasswordChange /> : <Navigate to="/" replace />
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={
            currentUser ? (
              needsPasswordChange ? <Navigate to="/change-password" replace /> : <Index />
            ) : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );

  // Debug mode overlay
  if (debugMode) {
    return (
      <div className="relative">
        {content}
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50 max-w-xs">
          <div className="font-bold text-green-400">🔧 Debug Mode Active</div>
          <div>User: {currentUser?.name || 'Not logged in'}</div>
          <div>Role: {currentUser?.role || 'None'}</div>
          <div>Organization: {currentOrganization?.name || 'None'}</div>
          <div>Org Type: {currentOrganization?.type || 'None'}</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Password Change: {needsPasswordChange ? 'Yes' : 'No'}</div>
          <div className="mt-1 pt-1 border-t border-gray-600">
            <div>Multi-Tenant: ✅ Active</div>
          </div>
        </div>
      </div>
    );
  }

  return content;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppContentWithOrganization />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Wrapper to provide organization context after auth is available
function AppContentWithOrganization() {
  const { currentUser } = useAuth();
  
  return (
    <OrganizationProvider currentUser={currentUser}>
      <AppContent />
    </OrganizationProvider>
  );
}

export default App;
