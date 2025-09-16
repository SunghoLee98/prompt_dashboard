// Test script for rating comment functionality
// Run with: node test-rating-comments.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:9090';
let authToken = null;
let testPromptId = null;

// Test user credentials
const testUser = {
  email: 'test_rating@example.com',
  password: 'password123',
  nickname: 'RatingTester'
};

const anotherUser = {
  email: 'another_rating@example.com',
  password: 'password123',
  nickname: 'AnotherTester'
};

async function register(user) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, user);
    console.log(`✅ Registered user: ${user.nickname}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`ℹ️  User ${user.nickname} already exists`);
    } else {
      console.error(`❌ Registration failed for ${user.nickname}:`, error.response?.data || error.message);
    }
  }
}

async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    });
    console.log(`✅ Logged in as: ${email}`);
    return response.data.accessToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createPrompt(token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/prompts`,
      {
        title: 'Test Prompt for Rating Comments',
        description: 'A test prompt to verify rating comment functionality',
        content: 'This is a test prompt content for rating comments',
        category: 'WRITING',
        tags: ['test', 'rating'],
        isPublic: true
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`✅ Created prompt with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('❌ Failed to create prompt:', error.response?.data || error.message);
    throw error;
  }
}

async function createRatingWithComment(promptId, rating, comment, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/prompts/${promptId}/ratings`,
      { rating, comment },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`✅ Created rating with comment: ${rating} stars - "${comment}"`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create rating:', error.response?.data || error.message);
    throw error;
  }
}

async function getRatingsWithComments(promptId, page = 0, size = 10) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/prompts/${promptId}/ratings?hasComment=true&page=${page}&size=${size}&sort=createdAt,desc`
    );
    console.log(`✅ Fetched ${response.data.content.length} ratings with comments`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch ratings:', error.response?.data || error.message);
    throw error;
  }
}

async function updateRating(promptId, rating, comment, token) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/prompts/${promptId}/ratings`,
      { rating, comment },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`✅ Updated rating to: ${rating} stars - "${comment}"`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update rating:', error.response?.data || error.message);
    throw error;
  }
}

async function deleteRating(promptId, token) {
  try {
    await axios.delete(
      `${API_BASE_URL}/api/prompts/${promptId}/ratings`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('✅ Deleted rating');
  } catch (error) {
    console.error('❌ Failed to delete rating:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('\n🚀 Starting Rating Comment System Tests\n');

  try {
    // 1. Setup users
    console.log('1️⃣  Setting up test users...');
    await register(testUser);
    await register(anotherUser);

    // 2. Login as first user and create prompt
    console.log('\n2️⃣  Creating test prompt...');
    const userToken = await login(testUser.email, testUser.password);
    testPromptId = await createPrompt(userToken);

    // 3. Login as another user to rate the prompt
    console.log('\n3️⃣  Testing rating with comments...');
    const anotherToken = await login(anotherUser.email, anotherUser.password);

    // 4. Create rating with comment
    console.log('Creating rating with comment...');
    await createRatingWithComment(
      testPromptId,
      5,
      'This is an excellent prompt! Very helpful for my writing tasks.',
      anotherToken
    );

    // 5. Update rating with new comment
    console.log('Updating rating with new comment...');
    await updateRating(
      testPromptId,
      4,
      'After using it more, I found some areas for improvement. Still very good though!',
      anotherToken
    );

    // 6. Fetch ratings with comments
    console.log('\n4️⃣  Testing pagination...');
    const ratingsPage = await getRatingsWithComments(testPromptId, 0, 10);
    console.log(`Total ratings with comments: ${ratingsPage.totalElements}`);
    console.log(`Total pages: ${ratingsPage.totalPages}`);

    if (ratingsPage.content.length > 0) {
      console.log('\n📝 Sample comment:');
      const firstRating = ratingsPage.content[0];
      console.log(`  User: ${firstRating.userNickname}`);
      console.log(`  Rating: ${firstRating.rating} stars`);
      console.log(`  Comment: ${firstRating.comment}`);
      console.log(`  Created: ${firstRating.createdAt}`);
    }

    // 7. Test comment length validation
    console.log('\n5️⃣  Testing comment length validation...');
    const longComment = 'x'.repeat(1001); // Exceeds 1000 character limit
    try {
      await createRatingWithComment(testPromptId, 3, longComment, userToken);
      console.log('❌ Should have failed with long comment');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected comment exceeding 1000 characters');
      }
    }

    // 8. Clean up
    console.log('\n6️⃣  Cleaning up...');
    await deleteRating(testPromptId, anotherToken);

    console.log('\n✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);