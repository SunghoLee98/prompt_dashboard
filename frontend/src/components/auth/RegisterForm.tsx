import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { getErrorMessage, getFieldErrors } from '../../utils/errorHandler';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../common/Card';
import ErrorAlert from '../ErrorAlert';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showError, setShowError] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setShowError(false);
    setSuccessMessage(null);

    try {
      await registerUser(data);
      // Show success message and redirect immediately
      setSuccessMessage('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      // Store success message in sessionStorage to show on login page
      sessionStorage.setItem('registrationSuccess', '회원가입이 완료되었습니다. 이제 로그인해주세요.');
      // Redirect immediately to login page
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = getErrorMessage(err);
      const fields = getFieldErrors(err);
      
      // Display the error message
      setError(errorMessage);
      setShowError(true);
      
      // Set field-specific errors if any
      if (fields.email) {
        setFormError('email', { message: fields.email });
      }
      if (fields.nickname) {
        setFormError('nickname', { message: fields.nickname });
      }
      if (fields.password) {
        setFormError('password', { message: fields.password });
      }
      if (fields.confirmPassword) {
        setFormError('confirmPassword', { message: fields.confirmPassword });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ErrorAlert
        message={error}
        open={showError}
        onClose={() => setShowError(false)}
        severity="error"
      />
      
      <ErrorAlert
        message={successMessage}
        open={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        severity="success"
      />
      
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">회원가입</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
            <Input
              label="이메일"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              disabled={isLoading}
              data-testid="email-input"
              {...register('email')}
            />

            <Input
              label="닉네임"
              type="text"
              placeholder="nickname"
              error={errors.nickname?.message}
              disabled={isLoading}
              data-testid="nickname-input"
              {...register('nickname')}
            />

            <Input
              label="비밀번호"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
              data-testid="password-input"
              {...register('password')}
            />
            <p className="text-xs text-gray-500">
              * 비밀번호는 8자 이상, 대문자, 소문자, 숫자를 포함해야 합니다.
            </p>

            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              {...register('confirmPassword')}
            />

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('terms')}
                data-testid="terms-checkbox"
                disabled={isLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                이용약관에 동의합니다
              </span>
            </label>
            {errors.terms && (
              <p className="text-sm text-red-600" role="alert">{errors.terms.message}</p>
            )}

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('privacy')}
                data-testid="privacy-checkbox"
                disabled={isLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                개인정보 처리방침에 동의합니다 (선택)
              </span>
            </label>
          </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
              data-testid="register-button"
            >
              {isLoading ? '회원가입 중...' : '회원가입'}
            </Button>
          </form>
        </CardBody>
        <CardFooter>
          <p className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link 
              to="/login" 
              className={`text-blue-600 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              로그인
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  );
};