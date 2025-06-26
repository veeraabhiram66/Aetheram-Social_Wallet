// Quick test to check if the backend API is working correctly
const testAddress = '0x484eab4066d5631754C329Cc27FA6213ba038cc8';
const apiUrl = 'http://localhost:4000';

async function testBackendAPI() {
  try {
    console.log('Testing backend API...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${apiUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test wallet info endpoint
    const walletResponse = await fetch(`${apiUrl}/wallet/${testAddress}`);
    const walletData = await walletResponse.json();
    console.log('Wallet info response:', JSON.stringify(walletData, null, 2));
    
    // Test nonce endpoint
    const nonceResponse = await fetch(`${apiUrl}/wallet/${testAddress}/nonce`);
    const nonceData = await nonceResponse.json();
    console.log('Nonce response:', JSON.stringify(nonceData, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBackendAPI();
