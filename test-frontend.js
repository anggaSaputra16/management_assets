// Test script untuk debug frontend
console.log('=== Testing Frontend Auth Flow ===');

// Test 1: Check if API is accessible
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => console.log('✅ Backend Health Check:', data))
  .catch(error => console.error('❌ Backend Health Check Failed:', error));

// Test 2: Try login
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('✅ Login Response:', data);
    
    if (data.success) {
      const token = data.data.token;
      console.log('Token received:', token.substring(0, 50) + '...');
      
      // Test 3: Try accessing companies with token
      const companyResponse = await fetch('http://localhost:5000/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const companyData = await companyResponse.json();
      console.log('✅ Companies Response:', companyData);
    }
  } catch (error) {
    console.error('❌ Test Login Failed:', error);
  }
};

// Run tests
setTimeout(testLogin, 1000);