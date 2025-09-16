import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { promptsApi } from '../api/prompts';
import { PromptForm } from '../components/prompts/PromptForm';
import type { PromptFormData } from '../utils/validation';

export const CreatePromptPage: React.FC = () => {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: promptsApi.createPrompt,
    onSuccess: (data) => {
      // Navigate to the newly created prompt detail page
      navigate(`/prompts/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed to create prompt:', error);
    },
  });

  const handleSubmit = async (data: PromptFormData) => {
    await createMutation.mutateAsync({
      ...data,
      tags: data.tags || [],
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PromptForm
        title="새 프롬프트 작성"
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onCancel={() => navigate('/prompts')}
      />
    </div>
  );
};