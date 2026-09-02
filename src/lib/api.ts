import {
  Post,
  Comment,
  Category,
  StudentPublic,
  StudentPrivate,
  Report,
} from '../shared/types.js';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Ensures HTTP-only cookies are passed
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  getSession: () => apiFetch<{ user: StudentPrivate | null }>('/api/session'),
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiFetch<{ user: StudentPrivate; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      localStorage.setItem('session_token', res.token);
    }
    return res;
  },
  register: async (payload: { email: string; password: string; role: string }) => {
    const res = await apiFetch<{ user: StudentPrivate; token?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      localStorage.setItem('session_token', res.token);
    }
    return res;
  },
  logout: async () => {
    localStorage.removeItem('session_token');
    return apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  // Categories
  getCategories: () => apiFetch<Category[]>('/api/categories'),

  // Feed & Posts
  getFeed: (params: { tab?: string; category?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.tab) query.append('tab', params.tab);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiFetch<{ posts: Post[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/feed?${query.toString()}`
    );
  },
  getPost: (id: number) => apiFetch<Post>(`/api/posts/${id}`),
  createPost: (post: { title: string; body: string; category_id: number; tags: string[] }) =>
    apiFetch<{ id: number; message: string }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    }),
  updatePost: (id: number, post: { title: string; body: string; category_id: number; tags: string[] }) =>
    apiFetch<{ success: boolean; message: string }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    }),
  deletePost: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/api/posts/${id}`, {
      method: 'DELETE',
    }),
  votePost: (id: number) =>
    apiFetch<{ voted: boolean; vote_count: number }>(`/api/posts/${id}/vote`, {
      method: 'POST',
    }),
  reportPost: (id: number, report: { reason: string; details?: string | null }) =>
    apiFetch<{ success: boolean; message: string }>(`/api/posts/${id}/report`, {
      method: 'POST',
      body: JSON.stringify(report),
    }),

  // Comments
  getComments: (postId: number) => apiFetch<Comment[]>(`/api/posts/${postId}/comments`),
  createComment: (postId: number, payload: { body: string; parent_id?: number | null }) =>
    apiFetch<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateComment: (id: number, payload: { body: string }) =>
    apiFetch<{ success: boolean; message: string }>(`/api/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteComment: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/api/comments/${id}`, {
      method: 'DELETE',
    }),
  voteComment: (id: number) =>
    apiFetch<{ voted: boolean; vote_count: number }>(`/api/comments/${id}/vote`, {
      method: 'POST',
    }),
  reportComment: (id: number, report: { reason: string; details?: string | null }) =>
    apiFetch<{ success: boolean; message: string }>(`/api/comments/${id}/report`, {
      method: 'POST',
      body: JSON.stringify(report),
    }),

  // Explore & Search
  explore: (params: { q?: string; category?: string; tag?: string; sort?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.category) query.append('category', params.category);
    if (params.tag) query.append('tag', params.tag);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiFetch<{ posts: Post[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/explore?${query.toString()}`
    );
  },

  // Users
  getUser: (id: number) => apiFetch<StudentPublic>(`/api/users/${id}`),
  getUserPosts: (id: number) => apiFetch<Post[]>(`/api/users/${id}/posts`),
  getUserComments: (id: number) =>
    apiFetch<Array<{ id: number; post_id: number; post_title: string; body: string; created_at: string; vote_count: number }>>(
      `/api/users/${id}/comments`
    ),

  // Moderation
  getReports: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiFetch<Report[]>(`/api/moderation/reports${query}`);
  },
  updateReport: (id: number, payload: { status: string; moderator_notes?: string | null }) =>
    apiFetch<{ success: boolean; message: string }>(`/api/moderation/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  moderatorDeletePost: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/api/moderation/posts/${id}`, {
      method: 'DELETE',
    }),
  moderatorDeleteComment: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/api/moderation/comments/${id}`, {
      method: 'DELETE',
    }),

  // Contact
  submitContact: (payload: { name: string; email: string; subject: string; message: string }) =>
    apiFetch<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
