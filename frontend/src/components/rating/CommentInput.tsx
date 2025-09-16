import React from 'react';
import { MessageSquare } from 'lucide-react';

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  showToggle?: boolean;
  isVisible?: boolean;
  onToggle?: () => void;
  error?: string;
  disabled?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  maxLength = 1000,
  placeholder = '이 프롬프트에 대한 의견을 남겨주세요...',
  showToggle = true,
  isVisible = false,
  onToggle,
  error,
  disabled = false,
}) => {
  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars <= 100;
  const isOverLimit = remainingChars < 0;

  if (showToggle && !isVisible) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        disabled={disabled}
      >
        <MessageSquare className="h-4 w-4" />
        코멘트 추가
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          코멘트 (선택사항)
        </label>
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          id="comment"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md
            focus:outline-none focus:ring-2
            transition-colors resize-none
            ${error || isOverLimit
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
          placeholder={placeholder}
          aria-invalid={!!error || isOverLimit}
          aria-describedby={error ? 'comment-error' : undefined}
        />

        <div className={`
          absolute bottom-2 right-2 text-xs
          ${isOverLimit ? 'text-red-500 font-semibold' :
            isNearLimit ? 'text-orange-500' : 'text-gray-500'}
        `}>
          {remainingChars.toLocaleString()}자 남음
        </div>
      </div>

      {(error || isOverLimit) && (
        <p id="comment-error" className="text-sm text-red-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
          {isOverLimit ? `글자 수 제한을 ${Math.abs(remainingChars)}자 초과했습니다.` : error}
        </p>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 좋은 리뷰 작성 팁:</p>
        <ul className="ml-4 space-y-0.5">
          <li>• 프롬프트의 장점과 개선점을 구체적으로 설명해주세요</li>
          <li>• 실제 사용 경험을 공유하면 다른 사용자에게 도움이 됩니다</li>
          <li>• 건설적인 피드백은 작성자의 성장에 도움이 됩니다</li>
        </ul>
      </div>
    </div>
  );
};