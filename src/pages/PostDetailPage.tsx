import React, { useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowBigUp,
  MessageSquare,
  Clock,
  Tag as TagIcon,
  Flag,
  Share2,
  Trash2,
  Edit3,
  Loader2,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Avatar } from '../components/Avatar.js';
import { ReportDialog } from '../components/ReportDialog.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { CommentItem } from '../components/CommentItem.js';
import { Post, Comment, Category } from '../shared/types.js';

export function PostDetailPage() {
  const [matchStandard, paramsStandard] = useRoute<{ id: string }>('/post/:id');
  const [matchPrefixed, paramsPrefixed] = useRoute<{ id: string }>('/lets-connect/post/:id');
  const params = paramsStandard || paramsPrefixed;
  const [, setLocation] = useLocation();
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();

  const postId = params && params.id ? parseInt(params.id, 10) : 0;

  const [newCommentBody, setNewCommentBody] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Edit Post State
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number>(1);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch Post Details
  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
  } = useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: () => api.getPost(postId),
    enabled: Boolean(postId),
  });

  // Fetch Categories for Edit Mode
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    enabled: isEditingPost,
  });

  // Fetch Threaded Comments
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
  } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: () => api.getComments(postId),
    enabled: Boolean(postId),
  });

  // Post Vote Mutation
  const voteMutation = useMutation({
    mutationFn: () => api.votePost(postId),
    onSuccess: (data) => {
      queryClient.setQueryData(['post', postId], (old: any) =>
        old ? { ...old, vote_count: data.vote_count, has_voted: data.voted } : old
      );
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: (body: string) => api.createComment(postId, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setNewCommentBody('');
      setCommentError(null);
    },
    onError: (err: any) => {
      setCommentError(err.message || 'Failed to post reply.');
    },
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: () => api.deletePost(postId),
    onSuccess: () => {
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.refetchQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      setLocation('/');
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to delete discussion.');
    },
  });

  // Edit Post Mutation
  const editPostMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; category_id: number; tags: string[] }) =>
      api.updatePost(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setIsEditingPost(false);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Failed to update post.');
    },
  });

  if (isPostLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading discussion thread...</p>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Post Not Found</h2>
        <p className="text-sm text-slate-500">
          This discussion may have been removed by its author or university moderators.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>
      </div>
    );
  }

  const isAuthor = Boolean(user && (user.id === post.student_id || user.id === post.author?.id));
  const isModerator = user?.role === 'Moderator';

  const handleVote = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    voteMutation.mutate();
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('session_token'));
    if (!user && !hasToken) {
      openAuthModal('login');
      return;
    }
    if (!newCommentBody.trim()) return;
    setCommentError(null);
    addCommentMutation.mutate(newCommentBody.trim());
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const startEditPost = () => {
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditCategoryId(post.category_id);
    setIsEditingPost(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editPostMutation.mutate({
      title: editTitle.trim(),
      body: editBody.trim(),
      category_id: editCategoryId,
      tags: post.tags || [],
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Questions</span>
      </Link>

      {/* Main Post Card */}
      <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs text-slate-800 space-y-5">
        {/* Post Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link href={`/u/${post.author.id}`}>
              <Avatar
                seed={post.author.avatar_seed}
                pseudonym={post.author.pseudonym}
                size="lg"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/u/${post.author.id}`}
                  className="font-medium text-slate-900 text-base hover:text-indigo-600 transition-colors"
                >
                  {post.author.pseudonym}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form vs Normal View */}
        {isEditingPost ? (
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2 border-t border-slate-100">
            {editError && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                {editError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Topic
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
              >
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Question Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Question Details
              </label>
              <textarea
                required
                rows={8}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingPost(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editPostMutation.isPending}
                className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                {editPostMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-snug">
              {post.title}
            </h1>

            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line border-y border-slate-100 py-5">
              {post.body}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 text-xs font-normal px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <TagIcon className="w-3 h-3 opacity-60" />
                    <span>#{tag}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <button
              id="btn-post-upvote"
              type="button"
              onClick={handleVote}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-all ${
                post.has_voted
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowBigUp className={`w-4 h-4 ${post.has_voted ? 'fill-white' : ''}`} />
              <span>{post.vote_count} Upvotes</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{hasCopied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {isAuthor && !isEditingPost && (
              <button
                type="button"
                onClick={startEditPost}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Edit post"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {(isAuthor || isModerator) && (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    openAuthModal('login');
                    return;
                  }
                  setIsDeleteOpen(true);
                }}
                className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setIsReportOpen(true);
              }}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
              title="Report content"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

      {/* Replies / Comments Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Replies ({comments.length})</span>
          </h2>
        </div>

        {/* New Reply Composer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {user ? (
                <>
                  Replying as <span className="font-medium text-indigo-600">{user.pseudonym}</span>
                </>
              ) : (
                'Sign in to post a reply'
              )}
            </span>
          </div>

          {commentError && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{commentError}</span>
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              id="textarea-new-reply"
              required
              rows={3}
              placeholder={
                user || (typeof window !== 'undefined' && localStorage.getItem('session_token'))
                  ? 'Write your reply or advice here...'
                  : 'Write your reply (sign in if requested)...'
              }
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Replies are anonymous and protected by community guidelines.
              </span>
              <button
                id="btn-submit-reply"
                type="submit"
                disabled={addCommentMutation.isPending || !newCommentBody.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Post Reply</span>
              </button>
            </div>
          </form>
        </div>

        {/* Threaded Comments List */}
        {isCommentsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse h-20" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No replies on this discussion yet.</p>
            <p className="text-xs text-slate-400">Be the first junior, senior, or alumni to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
              />
            ))}
          </div>
        )}
      </section>

      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetPreview={post.title}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action will permanently remove the discussion and all associated replies."
        confirmLabel="Delete Question"
        isLoading={deletePostMutation.isPending}
        onConfirm={() => {
          deletePostMutation.mutate();
        }}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
