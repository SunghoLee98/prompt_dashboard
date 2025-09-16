import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/common/Layout';
import { PrivateRoute } from './components/auth/PrivateRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PromptsListPage } from './pages/PromptsListPage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { CreatePromptPage } from './pages/CreatePromptPage';
import { EditPromptPage } from './pages/EditPromptPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { FeedPage } from './pages/FeedPage';
import { NotificationsPage } from './pages/NotificationsPage';
// import { BookmarksPage } from './pages/BookmarksPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TestPage } from './TestPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Test route */}
              <Route path="/test" element={<TestPage />} />
              
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/prompts" element={<PromptsListPage />} />
              <Route path="/prompts/:id" element={<PromptDetailPage />} />
              <Route path="/prompt/:id" element={<PromptDetailPage />} />
              <Route path="/users/:userId" element={<UserProfilePage />} />

              {/* Protected routes */}
              <Route
                path="/prompts/new"
                element={
                  <PrivateRoute>
                    <CreatePromptPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/prompts/:id/edit"
                element={
                  <PrivateRoute>
                    <EditPromptPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <PrivateRoute>
                    <FeedPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                }
              />
              {/* <Route
                path="/bookmarks"
                element={
                  <PrivateRoute>
                    <BookmarksPage />
                  </PrivateRoute>
                }
              /> */}

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;