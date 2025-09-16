import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요').max(255),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(30, '닉네임은 최대 30자까지 가능합니다')
    .regex(/^[a-zA-Z0-9_]+$/, '닉네임은 영문, 숫자, 언더스코어만 사용 가능합니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'
    ),
  confirmPassword: z.string().min(8, '비밀번호 확인을 입력해주세요'),
  terms: z.boolean().refine((val) => val === true, {
    message: '이용약관에 동의해야 합니다',
  }),
  privacy: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

export const promptSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(100, '제목은 최대 100자까지 가능합니다'),
  description: z
    .string()
    .min(10, '설명은 최소 10자 이상이어야 합니다')
    .max(300, '설명은 최대 300자까지 가능합니다'),
  content: z
    .string()
    .min(20, '내용은 최소 20자 이상이어야 합니다')
    .max(10000, '내용은 최대 10000자까지 가능합니다'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  tags: z.array(z.string().min(2).max(20)).max(5).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PromptFormData = z.infer<typeof promptSchema>;