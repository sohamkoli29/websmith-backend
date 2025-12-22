import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testUpload() {
  try {
    // 1. Login to get token
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sohamkoli@portfolio.com',
        password: 'KOLIkoli@029'
      })
    });

    const loginData = await loginRes.json();
    
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.data.tokens.accessToken;
    console.log('✅ Login successful');

    // 2. Test single file upload
    console.log('\n📤 Testing single file upload...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-image.jpg'));
    formData.append('type', 'general');
    formData.append('folder', 'test');

    const uploadRes = await fetch(`${API_URL}/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const uploadData = await uploadRes.json();
    console.log('Single upload response:', JSON.stringify(uploadData, null, 2));

    // 3. Test multiple file upload
    console.log('\n📤📤 Testing multiple file upload...');
    
    const multiFormData = new FormData();
    multiFormData.append('files', fs.createReadStream('test-image.jpg'));
    multiFormData.append('files', fs.createReadStream('test-document.pdf'));
    multiFormData.append('type', 'general');

    const multiRes = await fetch(`${API_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...multiFormData.getHeaders()
      },
      body: multiFormData
    });

    const multiData = await multiRes.json();
    console.log('Multiple upload response:', JSON.stringify({
      success: multiData.success,
      message: multiData.message,
      stats: multiData.data?.stats
    }, null, 2));

    // 4. List media
    console.log('\n📋 Listing media...');
    const listRes = await fetch(`${API_URL}/upload/media?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const listData = await listRes.json();
    console.log('Media list count:', listData.data?.media?.length);

    // 5. Get storage stats
    console.log('\n📊 Getting storage stats...');
    const statsRes = await fetch(`${API_URL}/upload/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const statsData = await statsRes.json();
    console.log('Storage stats:', JSON.stringify(statsData.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();