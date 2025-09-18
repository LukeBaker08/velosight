
/**
 * Root application component that establishes the provider hierarchy and routing structure.
 * Handles global error boundaries, authentication, query management, and UI theming.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Projects from '@/pages/Projects';
import Project from '@/pages/Project';
import FidereKnowledge from '@/pages/FidereKnowledge';
import Settings from '@/pages/Settings';
import FAQ from '@/pages/FAQ';
import Support from '@/pages/Support';
import DeliveryConfidence from '@/pages/reports/DeliveryConfidence';
import RiskAssessment from '@/pages/reports/RiskAssessment';
import GatewayReview from '@/pages/reports/GatewayReview';
import Hypothesis from '@/pages/reports/Hypothesis';
import CustomAnalysis from '@/pages/reports/CustomAnalysis';
import NotFound from '@/pages/NotFound';

// Configure React Query client with default settings
const queryClient = new QueryClient();

/**
 * Main App component that wraps the application with necessary providers and defines routing
 * @returns JSX element with provider hierarchy and route definitions
 */
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <AuthProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/project/:id" element={<ProtectedRoute><Project /></ProtectedRoute>} />
                <Route path="/knowledge" element={<ProtectedRoute><FidereKnowledge /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/support" element={<Support />} />
                
                {/* Report Routes */}
                <Route path="/reports/delivery-confidence-assessment/:projectId" element={<ProtectedRoute><DeliveryConfidence /></ProtectedRoute>} />
                <Route path="/reports/delivery-confidence-assessment/:projectId/:analysisId" element={<ProtectedRoute><DeliveryConfidence /></ProtectedRoute>} />
                
                <Route path="/reports/risk-assessment/:projectId" element={<ProtectedRoute><RiskAssessment /></ProtectedRoute>} />
                <Route path="/reports/risk-assessment/:projectId/:analysisId" element={<ProtectedRoute><RiskAssessment /></ProtectedRoute>} />
                
                <Route path="/reports/gateway-review/:projectId" element={<ProtectedRoute><GatewayReview /></ProtectedRoute>} />
                <Route path="/reports/gateway-review/:projectId/:analysisId" element={<ProtectedRoute><GatewayReview /></ProtectedRoute>} />
                
                <Route path="/reports/hypothesis/:projectId" element={<ProtectedRoute><Hypothesis /></ProtectedRoute>} />
                <Route path="/reports/hypothesis/:projectId/:analysisId" element={<ProtectedRoute><Hypothesis /></ProtectedRoute>} />
                
                <Route path="/reports/custom-analysis/:projectId" element={<ProtectedRoute><CustomAnalysis /></ProtectedRoute>} />
                <Route path="/reports/custom-analysis/:projectId/:analysisId" element={<ProtectedRoute><CustomAnalysis /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
            <Sonner />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
