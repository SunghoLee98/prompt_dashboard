import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { promptSchema, type PromptFormData } from '../../utils/validation';
import { promptsApi } from '../../api/prompts';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Card, CardHeader, CardBody } from '../common/Card';
import { X } from 'lucide-react';

interface PromptFormProps {
  initialData?: PromptFormData;
  onSubmit: (data: PromptFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  title?: string;
}

export const PromptForm: React.FC<PromptFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  title = '프롬프트',
}) => {
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = React.useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: promptsApi.getCategories,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    setValue('tags', tags);
  }, [tags, setValue]);

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      const newTag = tagInput.trim();
      if (newTag.length >= 2 && newTag.length <= 20 && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">{title}</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="제목"
            placeholder="프롬프트 제목을 입력하세요"
            error={errors.title?.message}
            data-testid="prompt-title-input"
            {...register('title')}
          />

          <TextArea
            label="설명"
            placeholder="프롬프트에 대한 간단한 설명을 입력하세요"
            rows={3}
            error={errors.description?.message}
            data-testid="prompt-description-input"
            {...register('description')}
          />

          <TextArea
            label="내용"
            placeholder="프롬프트 내용을 입력하세요"
            rows={10}
            error={errors.content?.message}
            data-testid="prompt-content-input"
            {...register('content')}
          />

          <Select
            label="카테고리"
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
            error={errors.category?.message}
            data-testid="prompt-category-select"
            {...register('category')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              태그 (최대 5개)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                name="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="태그를 입력하고 Enter 또는 추가 버튼을 누르세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={tags.length >= 5}
                data-testid="prompt-tags-input"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 5}
                variant="secondary"
              >
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel || (() => window.history.back())}
            >
              취소
            </Button>
            <Button type="submit" isLoading={isLoading} data-testid="prompt-submit-btn">
              {initialData ? '수정' : '저장'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};