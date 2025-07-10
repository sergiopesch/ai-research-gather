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
