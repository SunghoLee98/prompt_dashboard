/**
 * Test Data Generator
 * Provides consistent test data across all E2E tests
 */

export const testUsers = {
  validUser: {
    username: 'testuser_' + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!@#',
    bio: 'This is a test user bio'
  },
  
  existingUser: {
    username: 'e2euser',
    email: 'e2etest@example.com',
    password: 'Test1234'
  },
  
  invalidUser: {
    username: '',
    email: 'invalid-email',
    password: '123'  // Too weak
  },
  
  adminUser: {
    username: 'admin',
    email: 'admin@promptdriver.com',
    password: 'AdminPass123!@#'
  }
};

export const testPrompts = {
  basicPrompt: {
    title: 'Test Prompt ' + Date.now(),
    description: 'This is a test prompt description',
    content: 'Generate a comprehensive test plan for a web application including unit tests, integration tests, and E2E tests.',
    category: 'Development',
    tags: ['testing', 'qa', 'automation']
  },
  
  longPrompt: {
    title: 'Complex Multi-Step Prompt',
    description: 'A detailed prompt with multiple instructions',
    content: `
      You are an expert software architect. Please help me design a scalable microservices architecture with the following requirements:
      
      1. User authentication and authorization service
      2. Product catalog service with search functionality
      3. Order management service with payment processing
      4. Notification service for email and SMS
      5. Analytics service for business intelligence
      
      For each service, provide:
      - Technology stack recommendations
      - Database design
      - API endpoints
      - Inter-service communication patterns
      - Deployment strategy
      - Monitoring and logging approach
    `.trim(),
    category: 'Architecture',
    tags: ['architecture', 'microservices', 'design', 'scalability']
  },
  
  searchablePrompts: [
    {
      title: 'JavaScript Testing Guide',
      description: 'Complete guide for JavaScript testing',
      content: 'How to write unit tests in JavaScript using Jest',
      category: 'Development',
      tags: ['javascript', 'testing', 'jest']
    },
    {
      title: 'React Component Testing',
      description: 'Testing React components effectively',
      content: 'Best practices for testing React components with React Testing Library',
      category: 'Development',
      tags: ['react', 'testing', 'frontend']
    },
    {
      title: 'API Testing Strategies',
      description: 'Comprehensive API testing approaches',
      content: 'How to test REST APIs using Postman and automated tools',
      category: 'Testing',
      tags: ['api', 'testing', 'automation']
    }
  ]
};

export const categories = [
  'Development',
  'Testing',
  'Design',
  'Architecture',
  'Data Science',
  'DevOps',
  'Security',
  'Other'
];

export const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'mostLiked', label: '좋아요순' },
  { value: 'alphabetical', label: '가나다순' }
];

export const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' }
];

export function generateRandomUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    username: `user_${timestamp}_${random}`,
    email: `user_${timestamp}_${random}@test.com`,
    password: `Pass_${timestamp}!@#`,
    bio: `Test user created at ${new Date().toISOString()}`
  };
}

export function generateRandomPrompt() {
  const timestamp = Date.now();
  const categoryIndex = Math.floor(Math.random() * categories.length);
  
  return {
    title: `Prompt ${timestamp}`,
    description: `Auto-generated test prompt at ${new Date().toISOString()}`,
    content: `This is test content for prompt ${timestamp}. It includes multiple lines.
    
    - First point
    - Second point
    - Third point
    
    Please provide a detailed response.`,
    category: categories[categoryIndex],
    tags: ['test', 'automated', `tag_${timestamp}`]
  };
}

export const apiEndpoints = {
  auth: {
    login: 'http://localhost:9090/api/auth/login',
    signup: 'http://localhost:9090/api/auth/signup',
    logout: 'http://localhost:9090/api/auth/logout',
    refresh: 'http://localhost:9090/api/auth/refresh'
  },
  prompts: {
    list: 'http://localhost:9090/api/prompts',
    create: 'http://localhost:9090/api/prompts',
    update: (id: string) => `http://localhost:9090/api/prompts/${id}`,
    delete: (id: string) => `http://localhost:9090/api/prompts/${id}`,
    like: (id: string) => `http://localhost:9090/api/prompts/${id}/like`,
    search: 'http://localhost:9090/api/prompts/search'
  },
  ratings: {
    create: (promptId: string) => `http://localhost:9090/api/prompts/${promptId}/ratings`,
    update: (promptId: string, ratingId: string) => `http://localhost:9090/api/prompts/${promptId}/ratings/${ratingId}`,
    delete: (promptId: string, ratingId: string) => `http://localhost:9090/api/prompts/${promptId}/ratings/${ratingId}`,
    list: (promptId: string) => `http://localhost:9090/api/prompts/${promptId}/ratings`,
    userRating: (promptId: string) => `http://localhost:9090/api/prompts/${promptId}/ratings/user`
  },
  users: {
    profile: 'http://localhost:9090/api/users/profile',
    update: 'http://localhost:9090/api/users/profile',
    delete: 'http://localhost:9090/api/users/account',
    public: (id: string) => `http://localhost:9090/api/users/${id}`
  }
};

export const performanceThresholds = {
  pageLoad: 3000, // 3 seconds
  apiResponse: 500, // 500ms
  searchResponse: 1000, // 1 second
  loginTime: 2000, // 2 seconds
  firstContentfulPaint: 1500, // 1.5 seconds
  largestContentfulPaint: 2500, // 2.5 seconds
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100 // 100ms
};

export const errorMessages = {
  invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다',
  emailRequired: '이메일을 입력해주세요',
  passwordRequired: '비밀번호를 입력해주세요',
  passwordMismatch: '비밀번호가 일치하지 않습니다',
  weakPassword: '비밀번호는 8자 이상이어야 합니다',
  duplicateEmail: '이미 사용중인 이메일입니다',
  sessionExpired: '세션이 만료되었습니다',
  networkError: '네트워크 오류가 발생했습니다',
  serverError: '서버 오류가 발생했습니다'
};

export const successMessages = {
  loginSuccess: '로그인되었습니다',
  signupSuccess: '회원가입이 완료되었습니다',
  logoutSuccess: '로그아웃되었습니다',
  promptCreated: '프롬프트가 생성되었습니다',
  promptUpdated: '프롬프트가 수정되었습니다',
  promptDeleted: '프롬프트가 삭제되었습니다',
  profileUpdated: '프로필이 업데이트되었습니다',
  passwordChanged: '비밀번호가 변경되었습니다'
};

export const testFiles = {
  validImage: 'tests/fixtures/test-avatar.jpg',
  largeImage: 'tests/fixtures/large-image.jpg',
  invalidFile: 'tests/fixtures/test.txt'
};

export const ratingTestData = {
  validRatings: [1, 2, 3, 4, 5],
  invalidRatings: [0, -1, 6, 10, 0.5, 3.5, null, undefined, 'abc'],
  
  ratingScenarios: [
    {
      name: 'Perfect rating',
      score: 5,
      expectedAverage: 5.0
    },
    {
      name: 'Good rating',
      score: 4,
      expectedAverage: 4.0
    },
    {
      name: 'Average rating',
      score: 3,
      expectedAverage: 3.0
    },
    {
      name: 'Below average rating',
      score: 2,
      expectedAverage: 2.0
    },
    {
      name: 'Poor rating',
      score: 1,
      expectedAverage: 1.0
    }
  ],
  
  multiUserRatings: [
    { userId: 'user1', score: 5 },
    { userId: 'user2', score: 4 },
    { userId: 'user3', score: 5 },
    { userId: 'user4', score: 3 },
    { userId: 'user5', score: 4 }
  ],
  
  expectedAverageCalculations: {
    singleRating: { ratings: [5], expected: 5.0 },
    twoRatings: { ratings: [5, 3], expected: 4.0 },
    multipleRatings: { ratings: [5, 4, 5, 3, 4], expected: 4.2 },
    allSame: { ratings: [4, 4, 4, 4], expected: 4.0 },
    mixed: { ratings: [1, 2, 3, 4, 5], expected: 3.0 }
  },
  
  ratingMessages: {
    success: {
      created: '평점이 등록되었습니다',
      updated: '평점이 수정되었습니다',
      deleted: '평점이 삭제되었습니다'
    },
    error: {
      notLoggedIn: '로그인이 필요합니다',
      ownPrompt: '본인의 프롬프트는 평가할 수 없습니다',
      invalidScore: '유효하지 않은 평점입니다',
      alreadyRated: '이미 평점을 등록하셨습니다',
      notFound: '프롬프트를 찾을 수 없습니다',
      serverError: '서버 오류가 발생했습니다'
    }
  },
  
  ratingDistribution: {
    wellRated: {
      5: 45,  // 45% gave 5 stars
      4: 30,  // 30% gave 4 stars
      3: 15,  // 15% gave 3 stars
      2: 7,   // 7% gave 2 stars
      1: 3    // 3% gave 1 star
    },
    poorlyRated: {
      5: 5,
      4: 10,
      3: 20,
      2: 35,
      1: 30
    },
    balanced: {
      5: 20,
      4: 20,
      3: 20,
      2: 20,
      1: 20
    }
  }
};