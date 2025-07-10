import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

interface DebugPanelProps {
  currentPaperId?: string | null;
  error?: string | null;
  connectionState?: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'retrying';
  retryAttempt?: number;
  debugInfo?: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  currentPaperId, 
  error, 
  connectionState = 'idle',
  retryAttempt = 0,
  debugInfo 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [healthCheck, setHealthCheck] = useState<{
    supabase: 'unknown' | 'success' | 'error';
    edgeFunction: 'unknown' | 'success' | 'error';
    paper: 'unknown' | 'success' | 'error';
    details: any;
  }>({
    supabase: 'unknown',
    edgeFunction: 'unknown',
    paper: 'unknown',
    details: {}
  });
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const results = {
      supabase: 'unknown' as const,
      edgeFunction: 'unknown' as const,
      paper: 'unknown' as const,
      details: {} as any
    };

    try {
      // Test Supabase database connection
      const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/papers?select=id,status&limit=1`, {
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        }
      });
      
      if (supabaseResponse.ok) {
        results.supabase = 'success';
        results.details.supabase = { status: supabaseResponse.status, message: 'Database connection OK' };
      } else {
        results.supabase = 'error';
        results.details.supabase = { 
          status: supabaseResponse.status, 
          message: `Database connection failed: ${supabaseResponse.statusText}` 
        };
      }
    } catch (error: any) {
      results.supabase = 'error';
      results.details.supabase = { error: error.message };
    }

    try {
      // Test Edge Function availability
      const edgeFunctionResponse = await fetch(`${SUPABASE_URL}/functions/v1/generatePodcastPreview`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        }
      });
      
      if (edgeFunctionResponse.ok) {
        results.edgeFunction = 'success';
        results.details.edgeFunction = { status: edgeFunctionResponse.status, message: 'Edge Function available' };
      } else {
        results.edgeFunction = 'error';
        results.details.edgeFunction = { 
          status: edgeFunctionResponse.status, 
          message: `Edge Function unavailable: ${edgeFunctionResponse.statusText}` 
        };
      }
    } catch (error: any) {
      results.edgeFunction = 'error';
      results.details.edgeFunction = { error: error.message };
    }

    if (currentPaperId) {
      try {
        // Test paper status
        const paperResponse = await fetch(`${SUPABASE_URL}/rest/v1/papers?select=id,title,status&id=eq.${currentPaperId}`, {
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
          }
        });
        
        if (paperResponse.ok) {
          const paperData = await paperResponse.json();
          if (paperData.length > 0) {
            const paper = paperData[0];
            if (paper.status === 'SELECTED') {
              results.paper = 'success';
              results.details.paper = { 
                title: paper.title, 
                status: paper.status, 
                message: 'Paper ready for conversation' 
              };
            } else {
              results.paper = 'error';
              results.details.paper = { 
                title: paper.title, 
                status: paper.status, 
                message: `Paper status is ${paper.status}, expected SELECTED` 
              };
            }
          } else {
            results.paper = 'error';
            results.details.paper = { message: 'Paper not found in database' };
          }
        } else {
          results.paper = 'error';
          results.details.paper = { 
            status: paperResponse.status, 
            message: `Failed to fetch paper: ${paperResponse.statusText}` 
          };
        }
      } catch (error: any) {
        results.paper = 'error';
        results.details.paper = { error: error.message };
      }
    }

    setHealthCheck(results);
    setIsChecking(false);
  };

  const getStatusIcon = (status: 'unknown' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'unknown' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  const getConnectionStateBadge = () => {
    switch (connectionState) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Connecting</Badge>;
      case 'retrying':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Retrying ({retryAttempt})</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-yellow-100/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-yellow-600" />
                <CardTitle className="text-lg text-yellow-800">Debug Panel</CardTitle>
                {error && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex items-center gap-2">
                {getConnectionStateBadge()}
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-yellow-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Current Error</h4>
                <p className="text-sm text-red-700 font-mono">{error}</p>
              </div>
            )}

            {/* Health Check Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">System Health Check</h4>
                <Button 
                  onClick={runHealthCheck} 
                  disabled={isChecking}
                  size="sm"
                  variant="outline"
                >
                  {isChecking ? (
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-2" />
                  )}
                  {isChecking ? 'Checking...' : 'Run Check'}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthCheck.supabase)}
                    <span className="text-sm font-medium">Supabase Database</span>
                  </div>
                  {getStatusBadge(healthCheck.supabase)}
                </div>

                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthCheck.edgeFunction)}
                    <span className="text-sm font-medium">Edge Functions</span>
                  </div>
                  {getStatusBadge(healthCheck.edgeFunction)}
                </div>

                {currentPaperId && (
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(healthCheck.paper)}
                      <span className="text-sm font-medium">Selected Paper</span>
                    </div>
                    {getStatusBadge(healthCheck.paper)}
                  </div>
                )}
              </div>

              {/* Health Check Details */}
              {Object.keys(healthCheck.details).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Details</h5>
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                    {JSON.stringify(healthCheck.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Connection Info */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Connection Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">{getConnectionStateBadge()}</div>
                </div>
                {retryAttempt > 0 && (
                  <div>
                    <span className="text-gray-600">Retry Attempts:</span>
                    <div className="mt-1 font-mono">{retryAttempt}</div>
                  </div>
                )}
                {currentPaperId && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Paper ID:</span>
                    <div className="mt-1 font-mono text-xs break-all">{currentPaperId}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Debug Information</h4>
                <pre className="text-xs text-gray-600 font-mono bg-gray-50 border rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            {/* Troubleshooting Tips */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Troubleshooting Tips</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Ensure OpenAI API key is configured in Supabase Edge Functions environment variables</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Verify Supabase Service Role Key is set in Edge Functions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Check that the selected paper has 'SELECTED' status in the database</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Monitor browser console and network tab for detailed error messages</span>
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Environment Configuration</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span>Supabase URL:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {SUPABASE_URL.substring(0, 30)}...
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Publishable Key:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};