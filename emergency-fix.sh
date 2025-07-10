#!/bin/bash

echo "🚨 EMERGENCY LIVE CONVERSATION FIX"
echo "=================================="
echo "This script applies IMMEDIATE fixes for the most critical issues."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Make the script executable
chmod +x fix-live-conversation.sh

echo -e "${RED}🚨 CRITICAL ISSUES IDENTIFIED:${NC}"
echo "1. Missing OpenAI API key in Supabase Edge Functions"
echo "2. Potential paper selection flow failures"
echo "3. Insufficient error handling in SSE connections"
echo "4. Missing retry logic for failed connections"
echo ""

echo -e "${YELLOW}📋 EMERGENCY ACTIONS:${NC}"
echo ""

# 1. Create emergency environment file
echo -e "${BLUE}1. Creating emergency environment configuration...${NC}"
cat > .env.emergency << 'EOF'
# EMERGENCY CONFIGURATION
# Add these to Supabase Edge Functions Environment Variables

OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Instructions:
# 1. Get OpenAI key from: https://platform.openai.com/api-keys
# 2. Get Service Role key from: Supabase Dashboard → Settings → API → service_role
# 3. Add both to: Supabase Dashboard → Settings → Edge Functions → Environment Variables
EOF
echo -e "${GREEN}✅ Created .env.emergency with instructions${NC}"

# 2. Create emergency test script
echo -e "${BLUE}2. Creating emergency test script...${NC}"
cat > emergency-test.js << 'EOF'
// EMERGENCY TEST SCRIPT
console.log('🔍 EMERGENCY LIVE CONVERSATION TEST');
console.log('===================================');

const SUPABASE_URL = "https://eapnatbiodenijfrpqcn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcG5hdGJpb2RlbmlqZnJwcWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NjczNjEsImV4cCI6MjA2NzU0MzM2MX0.pR-zyk4aiAzsl9xwP7VU8hLuo-3r6KXod2rk0468TZU";

async function emergencyTest() {
    console.log('\n🔍 Testing Supabase Database...');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/papers?select=id,status&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (response.ok) {
            console.log('✅ Database: OK');
        } else {
            console.log('❌ Database: FAILED', response.status);
        }
    } catch (error) {
        console.log('❌ Database: ERROR', error.message);
    }
    
    console.log('\n🔍 Testing Edge Functions...');
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generatePodcastPreview`, {
            method: 'OPTIONS',
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (response.ok) {
            console.log('✅ Edge Functions: OK');
        } else {
            console.log('❌ Edge Functions: FAILED', response.status);
        }
    } catch (error) {
        console.log('❌ Edge Functions: ERROR', error.message);
    }
    
    console.log('\n🔍 Testing Paper Selection...');
    const selectedPaper = localStorage.getItem('selectedPaper');
    if (selectedPaper) {
        console.log('✅ Selected Paper:', selectedPaper);
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/papers?select=id,title,status&id=eq.${selectedPaper}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    console.log('✅ Paper Status:', data[0].status);
                    if (data[0].status !== 'SELECTED') {
                        console.log('⚠️  WARNING: Paper status is not SELECTED');
                    }
                } else {
                    console.log('❌ Paper not found in database');
                }
            }
        } catch (error) {
            console.log('❌ Paper Check: ERROR', error.message);
        }
    } else {
        console.log('⚠️  No paper selected');
    }
    
    console.log('\n📋 EMERGENCY CHECKLIST:');
    console.log('1. [ ] Add OPENAI_API_KEY to Supabase Edge Functions');
    console.log('2. [ ] Add SUPABASE_SERVICE_ROLE_KEY to Supabase Edge Functions');
    console.log('3. [ ] Select a paper (status should be SELECTED)');
    console.log('4. [ ] Test live conversation from Processing Hub');
    console.log('\n🆘 If all tests pass but conversation still fails:');
    console.log('   → Check Supabase Edge Function logs');
    console.log('   → Verify OpenAI API key is valid');
    console.log('   → Monitor browser Network tab during conversation');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    emergencyTest();
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = { emergencyTest };
}
EOF
echo -e "${GREEN}✅ Created emergency-test.js${NC}"

# 3. Create emergency hook patch
echo -e "${BLUE}3. Creating emergency hook patch...${NC}"
cat > src/hooks/usePodcastPreview-emergency-patch.ts << 'EOF'
// EMERGENCY PATCH for usePodcastPreview
// Apply this patch if live conversation fails

import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

// Emergency logging
const log = (message: string, data?: any) => {
  console.log(`🚨 [Emergency] ${message}`, data || '');
};

export const usePodcastPreviewEmergencyPatch = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [currentTypingSpeaker, setCurrentTypingSpeaker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    log('Emergency cleanup');
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
        readerRef.current.releaseLock();
      } catch (e) {
        log('Cleanup error', e);
      }
      readerRef.current = null;
    }
    setIsLive(false);
    setIsGenerating(false);
    setCurrentTypingSpeaker(null);
  }, []);

  const stopConversation = useCallback(() => {
    log('Emergency stop conversation');
    cleanup();
    toast({
      title: "Conversation Stopped",
      description: "Emergency stop activated",
    });
  }, [cleanup, toast]);

  const generateLivePreview = useCallback(async (paperId: string) => {
    log('Emergency live preview generation', { paperId });
    
    if (isGenerating || isLive) {
      log('Already generating, skipping');
      return;
    }
    
    setIsGenerating(true);
    setDialogue([]);
    setCurrentPaperId(paperId);
    setError(null);
    
    try {
      // Validate paper first
      log('Validating paper...');
      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .select('id, title, status')
        .eq('id', paperId)
        .single();
      
      if (paperError || !paper) {
        throw new Error('Paper not found. Please select a paper first.');
      }
      
      if (paper.status !== 'SELECTED') {
        throw new Error(`Paper status is ${paper.status}, expected SELECTED. Please select the paper first.`);
      }
      
      log('Paper validated', paper);
      
      // Try to establish connection
      const functionUrl = `${SUPABASE_URL}/functions/v1/generatePodcastPreview`;
      log('Connecting to', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ paper_id: paperId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        log('Connection failed', { status: response.status, error: errorText });
        
        // Specific error handling
        if (errorText.includes('OpenAI API key')) {
          throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase Edge Functions environment variables.');
        } else if (response.status === 404) {
          throw new Error('Edge Function not found. Please check Supabase configuration.');
        } else {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }
      
      if (!response.body) {
        throw new Error('No response body received');
      }
      
      log('Connection established, starting stream...');
      
      const reader = response.body.getReader();
      readerRef.current = reader;
      
      setIsGenerating(false);
      setIsLive(true);
      
      toast({
        title: "Live Conversation Started",
        description: "Emergency mode: Basic conversation active",
      });
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            log('Stream completed');
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;
            
            try {
              const jsonStr = line.slice(6);
              const eventData = JSON.parse(jsonStr);
              
              log('SSE Event', eventData);
              
              if (eventData.type === 'typing_start') {
                setCurrentTypingSpeaker(eventData.speaker);
              } else if (eventData.type === 'typing_stop') {
                setCurrentTypingSpeaker(null);
              } else if (eventData.type === 'message' || eventData.speaker) {
                setDialogue(prev => [...prev, {
                  speaker: eventData.speaker,
                  text: eventData.text,
                  timestamp: eventData.timestamp || Date.now(),
                  exchange: eventData.exchange
                }]);
                setCurrentTypingSpeaker(null);
              } else if (eventData.type === 'conversation_end') {
                setIsLive(false);
                toast({
                  title: "Conversation Completed",
                  description: "Emergency mode conversation finished successfully!",
                });
              } else if (eventData.type === 'error') {
                throw new Error(eventData.message || 'Server error occurred');
              }
            } catch (parseError) {
              log('Parse error', parseError);
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          log('Reader cleanup error', e);
        }
        setIsLive(false);
        setCurrentTypingSpeaker(null);
      }
      
    } catch (error: any) {
      log('Emergency error', error);
      setError(error.message);
      
      toast({
        title: "Emergency Mode: Conversation Failed",
        description: error.message,
        variant: "destructive",
      });
      
      cleanup();
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isLive, toast, cleanup]);

  const clearPreview = useCallback(() => {
    log('Emergency clear preview');
    cleanup();
    setDialogue([]);
    setCurrentPaperId(null);
    setError(null);
  }, [cleanup]);

  return useMemo(() => ({
    generateLivePreview,
    stopConversation,
    clearPreview,
    isGenerating,
    dialogue,
    isLive,
    currentPaperId,
    currentTypingSpeaker,
    hasDialogue: dialogue.length > 0,
    error,
  }), [generateLivePreview, stopConversation, clearPreview, isGenerating, dialogue, isLive, currentPaperId, currentTypingSpeaker, error]);
};
EOF
echo -e "${GREEN}✅ Created emergency hook patch${NC}"

# 4. Instructions
echo ""
echo -e "${RED}🚨 EMERGENCY INSTRUCTIONS:${NC}"
echo ""
echo -e "${YELLOW}STEP 1: Configure Environment Variables (CRITICAL)${NC}"
echo "1. Go to: https://eapnatbiodenijfrpqcn.supabase.co/project/settings/api"
echo "2. Navigate: Settings → Edge Functions → Environment Variables"
echo "3. Add the variables from .env.emergency file"
echo ""
echo -e "${YELLOW}STEP 2: Test the System${NC}"
echo "Run: node emergency-test.js"
echo ""
echo -e "${YELLOW}STEP 3: Apply Emergency Hook (if needed)${NC}"
echo "In ProcessingHub.tsx, replace the hook import:"
echo "import { usePodcastPreviewEmergencyPatch } from '@/hooks/usePodcastPreview-emergency-patch';"
echo "const { ... } = usePodcastPreviewEmergencyPatch();"
echo ""
echo -e "${YELLOW}STEP 4: Monitor and Debug${NC}"
echo "1. Open browser console (F12)"
echo "2. Look for [Emergency] log messages"
echo "3. Check Network tab for SSE connection"
echo "4. Verify Supabase Edge Function logs"
echo ""
echo -e "${GREEN}🎯 EXPECTED OUTCOME:${NC}"
echo "After configuring environment variables, the live conversation should work."
echo "If it still fails, check the emergency test results for specific issues."
echo ""
echo -e "${RED}⚠️  CRITICAL REMINDER:${NC}"
echo "The #1 cause of failure is missing OpenAI API key in Supabase Edge Functions!"
echo ""

# Make emergency test executable
chmod +x emergency-test.js

echo -e "${GREEN}🚀 Emergency fix preparation complete!${NC}"
echo "Next: Configure environment variables in Supabase Dashboard"