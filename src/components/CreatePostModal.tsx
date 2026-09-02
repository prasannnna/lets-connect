import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { X, Plus, Tag as TagIcon, AlertCircle, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Category } from '../shared/types.js';

export function CreatePostModal() {
  const { isCreatePostModalOpen, closeCreatePostModal, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    enabled: isCreatePostModalOpen,
  });

  const createPostMutation = useMutation({
    mutationFn: (newPost: { title: string; body: string; category_id: number; tags: string[] }) =>
      api.createPost(newPost),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeCreatePostModal();
      setTitle('');
      setBody('');
      setCategoryId('');
      setTags([]);
      setErrorMsg(null);
      setLocation(`/post/${data.id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create post.');
    },
  });

  if (!isCreatePostModalOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!categoryId) {
      setErrorMsg('Please select a category for your post.');
      return;
    }

    createPostMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      category_id: Number(categoryId),
      tags,
    });
  };

  return (
    <div
      id="modal-create-post-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="modal-create-post-card"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <Sparkles className="w-5 h-5" />
            <span>Create Anonymous Post</span>
          </div>
          <button
            id="btn-close-create-post-modal"
            type="button"
            onClick={closeCreatePostModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-medium flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Content Check Failed</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* User pseudonym preview */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
            <div className="text-slate-600">
              Posting publicly as: <span className="font-bold text-indigo-700">{user?.pseudonym}</span> ({user?.role})
            </div>
            <span className="text-slate-400">Real email is hidden</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-post-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">Select a category...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-post-title"
              type="text"
              required
              minLength={5}
              maxLength={180}
              placeholder="e.g. How to prepare for AWS placement interview or Capstone project stack..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discussion / Question Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="textarea-post-body"
              required
              rows={6}
              minLength={10}
              placeholder="Provide background context, questions, code snippets, or placement interview details..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags (Up to 5)
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <TagIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="input-post-tag"
                  type="text"
                  placeholder="e.g. Placements, LeetCode, Capstone, Hostel"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                id="btn-add-tag"
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              All submissions are screened by our automated safety engine to prevent harassment, personal attacks against faculty/students, and doxxing.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-create-post"
              type="button"
              onClick={closeCreatePostModal}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-post"
              type="submit"
              disabled={createPostMutation.isPending}
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-100 transition-colors flex items-center gap-2"
            >
              {createPostMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
