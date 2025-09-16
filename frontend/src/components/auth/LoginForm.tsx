import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, type LoginFormData } from '../../utils/validation';
import { getErrorMessage, getFieldErrors } from '../../utils/errorHandler';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../common/Card';
import ErrorAlert from '../ErrorAlert';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showError, setShowError] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Check for registration success message
  React.useEffect(() => {
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      setSuccessMessage(registrationSuccess);
      sessionStorage.removeItem('registrationSuccess');
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setShowError(false);

    try {
      await login(data);
      // Navigate to prompts page after successful login
      navigate('/prompts');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = getErrorMessage(err);
      const fields = getFieldErrors(err);
      
      setError(errorMessage);
      setShowError(true);
      
      // Set field-specific errors if any
      if (fields.email) {
        setFormError('email', { message: fields.email });
      }
      if (fields.password) {
        setFormError('password', { message: fields.password });
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
          <h2 className="text-2xl font-bold text-center">로그인</h2>
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
              label="비밀번호"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
              data-testid="password-input"
              {...register('password')}
            />

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('remember')}
                data-testid="remember-me"
                disabled={isLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                로그인 상태 유지
              </span>
            </label>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
              data-testid="login-button"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardBody>
        <CardFooter>
          <p className="text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link 
              to="/signup" 
              className={`text-blue-600 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              회원가입
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  );
};