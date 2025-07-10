#!/bin/bash

echo "🚀 CRITICAL FIX: Live Conversation Setup Script"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Environment Variables Check${NC}"
echo "============================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local file...${NC}"
    cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://eapnatbiodenijfrpqcn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcG5hdGJpb2RlbmlqZnJwcWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NjczNjEsImV4cCI6MjA2NzU0MzM2MX0.pR-zyk4aiAzsl9xwP7VU8hLuo-3r6KXod2rk0468TZU

# OpenAI Configuration (REQUIRED - ADD YOUR KEY HERE)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Service Role Key (REQUIRED - GET FROM SUPABASE DASHBOARD)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

echo -e "\n${BLUE}📋 Step 2: Install Required Dependencies${NC}"
echo "============================================"

# Check if npm/yarn is available
if command -v npm &> /dev/null; then
    echo -e "${YELLOW}📦 Installing/updating dependencies with npm...${NC}"
    npm install
elif command -v yarn &> /dev/null; then
    echo -e "${YELLOW}📦 Installing/updating dependencies with yarn...${NC}"
    yarn install
else
    echo -e "${RED}❌ Error: Neither npm nor yarn found${NC}"
    exit 1
fi

echo -e "\n${BLUE}📋 Step 3: Supabase CLI Setup${NC}"
echo "============================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    if command -v npm &> /dev/null; then
        npm install -g supabase
    else
        echo -e "${RED}❌ Please install Supabase CLI manually: https://supabase.com/docs/guides/cli${NC}"
    fi
else
    echo -e "${GREEN}✅ Supabase CLI found${NC}"
fi

echo -e "\n${BLUE}📋 Step 4: Project Configuration Check${NC}"
echo "============================================"

# Validate Supabase config
if [ -f "supabase/config.toml" ]; then
    echo -e "${GREEN}✅ Supabase config found${NC}"
    echo "Project ID: $(grep 'project_id' supabase/config.toml | cut -d '"' -f 2)"
else
    echo -e "${RED}❌ Supabase config missing${NC}"
fi

echo -e "\n${BLUE}📋 Step 5: Critical Environment Variables${NC}"
echo "============================================"

echo -e "${RED}🚨 CRITICAL ACTIONS REQUIRED:${NC}"
echo ""
echo -e "${YELLOW}1. Add OpenAI API Key to Supabase:${NC}"
echo "   - Go to: https://eapnatbiodenijfrpqcn.supabase.co/project/settings/api"
echo "   - Navigate to: Settings → Edge Functions → Environment Variables"
echo "   - Add: OPENAI_API_KEY = your_openai_api_key"
echo ""
echo -e "${YELLOW}2. Add Supabase Service Role Key:${NC}"
echo "   - In the same Edge Functions environment variables section"
echo "   - Add: SUPABASE_SERVICE_ROLE_KEY = your_service_role_key"
echo "   - Get service role key from: Settings → API → service_role key"
echo ""
echo -e "${YELLOW}3. Update .env.local file:${NC}"
echo "   - Edit .env.local with your actual API keys"
echo "   - OPENAI_API_KEY=sk-your-actual-openai-key"
echo "   - SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key"

echo -e "\n${BLUE}📋 Step 6: Health Check Script${NC}"
echo "============================================"

cat > check-live-conversation.js << 'EOF'
// Health check script for live conversation
const SUPABASE_URL = "https://eapnatbiodenijfrpqcn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcG5hdGJpb2RlbmlqZnJwcWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NjczNjEsImV4cCI6MjA2NzU0MzM2MX0.pR-zyk4aiAzsl9xwP7VU8hLuo-3r6KXod2rk0468TZU";

async function checkHealth() {
    console.log("🔍 Live Conversation Health Check");
    console.log("================================");
    
    // Test Supabase connection
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/papers?select=id,status&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (response.ok) {
            console.log("✅ Supabase database connection: OK");
        } else {
            console.log("❌ Supabase database connection: FAILED", response.status);
        }
    } catch (error) {
        console.log("❌ Supabase database connection: ERROR", error.message);
    }
    
    // Test Edge Function availability
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generatePodcastPreview`, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (response.ok) {
            console.log("✅ Edge Function availability: OK");
        } else {
            console.log("❌ Edge Function availability: FAILED", response.status);
        }
    } catch (error) {
        console.log("❌ Edge Function availability: ERROR", error.message);
    }
}

if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    checkHealth();
} else {
    // Browser environment
    window.checkLiveConversationHealth = checkHealth;
}
EOF

echo -e "${GREEN}✅ Created health check script: check-live-conversation.js${NC}"

echo -e "\n${BLUE}📋 Step 7: Development Server Setup${NC}"
echo "============================================"

cat > start-with-debug.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting development server with debugging..."
echo "==============================================="

# Set debug environment variables
export DEBUG=true
export VITE_DEBUG_MODE=true

# Start the development server
if command -v npm &> /dev/null; then
    npm run dev
elif command -v yarn &> /dev/null; then
    yarn dev
else
    echo "❌ No package manager found"
fi
EOF

chmod +x start-with-debug.sh
echo -e "${GREEN}✅ Created debug startup script: start-with-debug.sh${NC}"

echo -e "\n${GREEN}🎉 SETUP COMPLETE!${NC}"
echo "=================="
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Complete the environment variable setup in Supabase dashboard"
echo "2. Update .env.local with your actual API keys"
echo "3. Run: ./start-with-debug.sh"
echo "4. Test the health check: node check-live-conversation.js"
echo ""
echo -e "${RED}🚨 REMINDER: The live conversation will NOT work until you add the OpenAI API key to Supabase Edge Functions!${NC}"