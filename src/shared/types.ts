import { z } from 'zod';

export type StudentRole = 'Junior' | 'Senior' | 'Alumni' | 'Moderator';

export interface StudentPublic {
  id: number;
  pseudonym: string;
  role: StudentRole;
  avatar_seed: string;
  created_at: string;
  posts_count?: number;
  comments_count?: number;
}

export interface StudentPrivate extends StudentPublic {
  email: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  accent: string;
  created_at: string;
  posts_count?: number;
}

export interface Post {
  id: number;
  student_id: number;
  category_id: number;
  title: string;
  body: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: StudentPublic;
  category: Category;
  vote_count: number;
  reply_count: number;
  has_voted?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  student_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: StudentPublic;
  vote_count: number;
  has_voted?: boolean;
  replies?: Comment[];
}

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: number;
  reporter_student_id: number;
  post_id: number | null;
  comment_id: number | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  moderator_notes: string | null;
  created_at: string;
  updated_at: string;
  target_type: 'post' | 'comment';
  post?: Post | null;
  comment?: Comment | null;
  reporter_pseudonym?: string;
  reviewer_pseudonym?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

// Zod Validation Schemas
export const ALLOWED_EMAIL_DOMAINS = ['aditya.ac.in', 'aec.edu.in'];

export const registerSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .refine((email) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return ALLOWED_EMAIL_DOMAINS.includes(domain);
    }, {
      message: `Only Aditya University domains (@aditya.ac.in, @aec.edu.in) are eligible.`,
    }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password is too long'),
  role: z.enum(['Junior', 'Senior', 'Alumni', 'Moderator']),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createPostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(180, 'Title cannot exceed 180 characters')
    .trim(),
  body: z
    .string()
    .min(10, 'Body must be at least 10 characters')
    .max(10000, 'Body cannot exceed 10,000 characters')
    .trim(),
  category_id: z.coerce.number().int().positive('Please select a valid category'),
  tags: z
    .array(z.string().min(1).max(25))
    .max(5, 'Maximum 5 tags allowed')
    .default([]),
});

export const editPostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(180, 'Title cannot exceed 180 characters')
    .trim(),
  body: z
    .string()
    .min(10, 'Body must be at least 10 characters')
    .max(10000, 'Body cannot exceed 10,000 characters')
    .trim(),
  category_id: z.coerce.number().int().positive(),
  tags: z.array(z.string().min(1).max(25)).max(5).default([]),
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(2, 'Reply must be at least 2 characters')
    .max(3000, 'Reply cannot exceed 3,000 characters')
    .trim(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
});

export const editCommentSchema = z.object({
  body: z
    .string()
    .min(2, 'Reply must be at least 2 characters')
    .max(3000, 'Reply cannot exceed 3,000 characters')
    .trim(),
});

export const createReportSchema = z.object({
  reason: z.enum([
    'Harassment',
    'Bullying',
    'Hate/abuse',
    'Spam',
    'Defamation',
    'Inappropriate content',
    'Personal information',
    'Other',
  ]),
  details: z.string().max(1000).optional().nullable(),
  post_id: z.coerce.number().int().positive().optional().nullable(),
  comment_id: z.coerce.number().int().positive().optional().nullable(),
}).refine((data) => data.post_id || data.comment_id, {
  message: 'Must specify either post_id or comment_id to report.',
});

export const updateReportSchema = z.object({
  status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']),
  moderator_notes: z.string().max(1000).optional().nullable(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(3000),
});
