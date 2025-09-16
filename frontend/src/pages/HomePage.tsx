import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ArrowRight, Code, Share2, Heart } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              AI 프롬프트 공유 플랫폼
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              효과적인 AI 프롬프트를 발견하고, 공유하며, 협업하세요.
              커뮤니티와 함께 더 나은 AI 경험을 만들어갑니다.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/prompts">
                <Button size="lg" className="flex items-center">
                  프롬프트 둘러보기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg">
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Code className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">다양한 프롬프트</h3>
              <p className="text-gray-600">
                다양한 카테고리의 검증된 프롬프트를 찾아보세요.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Share2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">쉬운 공유</h3>
              <p className="text-gray-600">
                나만의 프롬프트를 커뮤니티와 쉽게 공유하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">커뮤니티 평가</h3>
              <p className="text-gray-600">
                좋아요와 리뷰로 품질 높은 프롬프트를 발견하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            지금 시작하세요
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            무료로 가입하고 프롬프트 커뮤니티에 참여하세요.
          </p>
          <Link to="/register">
            <Button size="lg">무료로 시작하기</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};