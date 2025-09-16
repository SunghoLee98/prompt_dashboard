import React from 'react';
import { PersonalizedFeed } from '../components/follow/PersonalizedFeed';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const FeedPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Login to see your personalized feed
          </h2>
          <p className="text-gray-600 mb-8">
            Follow creators to get their latest prompts in your feed
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login">
              <Button>Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PersonalizedFeed />
    </div>
  );
};