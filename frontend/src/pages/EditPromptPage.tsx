import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { promptsApi } from '../api/prompts';
import { PromptForm } from '../components/prompts/PromptForm';
import type { PromptFormData } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';

export const EditPromptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => promptsApi.getPrompt(Number(id)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: PromptFormData) => 
      promptsApi.updatePrompt(Number(id), {
        ...data,
        tags: data.tags || [],
      }),
    onSuccess: (data) => {
      navigate(`/prompts/${data.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">프롬프트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!prompt || prompt.author.id !== user?.id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600">프롬프트를 수정할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const initialData: PromptFormData = {
    title: prompt.title,
    description: prompt.description,
    content: prompt.content,
    category: prompt.category,
    tags: prompt.tags,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PromptForm
        title="프롬프트 수정"
        initialData={initialData}
        onSubmit={(data) => updateMutation.mutateAsync(data).then(() => {})}
        isLoading={updateMutation.isPending}
        onCancel={() => navigate(`/prompts/${id}`)}
      />
    </div>
  );
};