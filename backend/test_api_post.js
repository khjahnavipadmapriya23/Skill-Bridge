const jwt = require('jsonwebtoken');

async function testPost() {
  const token = jwt.sign({ id: 1, email: 'khjahnavipadmapriya23@gmail.com', role: 'student' }, 'jwt_secret_key_12345');
  
  try {
    const response = await fetch('http://localhost:5000/api/skills/my-skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ skillIds: [1, 2, 3, 4] })
    });
    
    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testPost();
