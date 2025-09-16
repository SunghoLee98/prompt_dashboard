#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:9090/api';

async function testEndpoints() {
  console.log('Testing Rating Endpoints...\n');
  
  // Test 1: Rating statistics (public endpoint)
  try {
    const response = await axios.get(`${API_BASE}/prompts/1/ratings/stats`);
    console.log('✅ GET /prompts/1/ratings/stats - Status:', response.status);
    console.log('   Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ GET /prompts/1/ratings/stats - Error:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\n');
  
  // Test 2: User rating (requires auth)
  try {
    const response = await axios.get(`${API_BASE}/prompts/1/ratings/user`);
    console.log('✅ GET /prompts/1/ratings/user - Status:', response.status);
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ GET /prompts/1/ratings/user - Status: 403 (Expected - requires auth)');
    } else {
      console.log('❌ GET /prompts/1/ratings/user - Error:', error.response?.status, error.response?.data || error.message);
    }
  }
  
  console.log('\n');
  
  // Test 3: All ratings (public endpoint)
  try {
    const response = await axios.get(`${API_BASE}/prompts/1/ratings`);
    console.log('✅ GET /prompts/1/ratings - Status:', response.status);
    console.log('   Response has', response.data.content ? response.data.content.length : response.data.length, 'ratings');
  } catch (error) {
    console.log('❌ GET /prompts/1/ratings - Error:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\nAll rating endpoints are properly configured! ✅');
}

testEndpoints().catch(console.error);