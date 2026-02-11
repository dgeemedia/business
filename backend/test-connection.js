// backend/test-connection.js
require('dotenv').config();

console.log('\n🔍 Diagnosing Database Connection...\n');

// 1. Check environment variables
console.log('1️⃣ Checking Environment Variables:');
console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  // Mask password for security
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log('   DATABASE_URL:', maskedUrl);
}
console.log('');

// 2. Test DNS resolution
console.log('2️⃣ Testing DNS Resolution:');
const dns = require('dns');
dns.resolve4('aws-1-us-east-1.pooler.supabase.com', (err, addresses) => {
  if (err) {
    console.log('   ❌ DNS Resolution Failed:', err.message);
  } else {
    console.log('   ✅ DNS Resolved:', addresses);
  }
  console.log('');
  
  // 3. Test port connectivity
  testConnection();
});

function testConnection() {
  console.log('3️⃣ Testing Port Connectivity:');
  const net = require('net');
  const client = new net.Socket();
  
  client.setTimeout(5000);
  
  client.on('connect', () => {
    console.log('   ✅ Port 6543 is reachable');
    client.destroy();
    testPrisma();
  });
  
  client.on('timeout', () => {
    console.log('   ❌ Connection timeout (firewall or network issue)');
    client.destroy();
    showSolutions();
  });
  
  client.on('error', (err) => {
    console.log('   ❌ Connection failed:', err.message);
    showSolutions();
  });
  
  client.connect(6543, 'aws-1-us-east-1.pooler.supabase.com');
}

async function testPrisma() {
  console.log('');
  console.log('4️⃣ Testing Prisma Connection:');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('   ✅ Prisma connected successfully!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log('   ✅ Database query successful!');
    console.log('   📊 Users in database:', userCount);
    
    await prisma.$disconnect();
    console.log('\n✨ All tests passed! Your connection is working.\n');
  } catch (error) {
    console.log('   ❌ Prisma connection failed:', error.message);
    showSolutions();
  }
}

function showSolutions() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 POSSIBLE SOLUTIONS:');
  console.log('='.repeat(60));
  
  console.log('\n1️⃣ CHECK SUPABASE PROJECT STATUS:');
  console.log('   - Go to https://app.supabase.com');
  console.log('   - Check if project "mmvzlgrnitfltcimougs" is PAUSED');
  console.log('   - If paused, click "Resume Project" and wait 2-3 minutes');
  
  console.log('\n2️⃣ TRY DIRECT CONNECTION (For Testing):');
  console.log('   Update .env with:');
  console.log('   DATABASE_URL="postgresql://postgres:QWqBMV5CSxclkybp@db.mmvzlgrnitfltcimougs.supabase.co:5432/postgres?sslmode=require"');
  
  console.log('\n3️⃣ CHECK FIREWALL/VPN:');
  console.log('   - Disable VPN if using one');
  console.log('   - Check Windows Firewall settings');
  console.log('   - Try from different network');
  
  console.log('\n4️⃣ VERIFY SUPABASE CONNECTION STRING:');
  console.log('   - Go to Supabase Dashboard');
  console.log('   - Project Settings → Database');
  console.log('   - Copy "Connection pooling" URL');
  console.log('   - Make sure it uses "Transaction" mode');
  
  console.log('\n5️⃣ CHECK CONNECTION POOLER SETTINGS:');
  console.log('   - Supabase Dashboard → Database → Connection pooling');
  console.log('   - Ensure pooler is enabled');
  console.log('   - Check if IP restrictions are blocking you');
  
  console.log('\n' + '='.repeat(60) + '\n');
}