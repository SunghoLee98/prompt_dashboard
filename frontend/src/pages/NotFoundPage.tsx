import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <p className="text-2xl font-semibold text-gray-900 mt-4">
          페이지를 찾을 수 없습니다
        </p>
        <p className="text-gray-600 mt-2">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            이전 페이지
          </Button>
          <Link to="/">
            <Button>
              <Home className="h-4 w-4 mr-1" />
              홈으로
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};