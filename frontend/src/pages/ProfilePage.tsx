import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { User, Mail, Calendar, Edit2, Check, X } from 'lucide-react';

const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(30, '닉네임은 최대 30자까지 가능합니다')
    .regex(/^[a-zA-Z0-9_]+$/, '닉네임은 영문, 숫자, 언더스코어만 사용 가능합니다'),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nickname: user?.nickname || '',
    },
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({ nickname: user.nickname });
    setError(null);
  };

  const onSubmit = async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.updateProfile(data);
      await refreshUser();
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('프로필 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">내 프로필</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">프로필 정보</h2>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                수정
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">프로필이 성공적으로 업데이트되었습니다.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-2" />
                  <div className="flex-1">
                    <Input
                      label="닉네임"
                      error={errors.nickname?.message}
                      {...register('nickname')}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button type="submit" size="sm" isLoading={isLoading}>
                        <Check className="h-4 w-4 mr-1" />
                        저장
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">닉네임</p>
                  <p className="font-medium">{user.nickname}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">가입일</p>
                <p className="font-medium">
                  {format(new Date(user.createdAt), 'yyyy년 MM월 dd일', {
                    locale: ko,
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};