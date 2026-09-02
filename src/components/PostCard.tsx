import React, { useState } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  ArrowBigUp,
  Tag as TagIcon,
  Flag,
  Pin,
  Trash2,
  Edit3,
  Share2,
} from 'lucide-react';
import { Post } from '../shared/types.js';
import { Avatar } from './Avatar.js';
import { ReportDialog } from './ReportDialog.js';
import { ConfirmModal } from './ConfirmModal.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';

interface PostCardProps {
  key?: React.Key;
  post: Post;
  onEdit?: (post: Post) => void;
}

export function PostCard({ post, onEdit }: PostCardProps) {
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const isAuthor = Boolean(user && (user.id === post.student_id || user.id === post.author?.id));
  const isModerator = user?.role === 'Moderator';

  // Optimistic voting state
  const [voted, setVoted] = useState(Boolean(post.has_voted));
  const [voteCount, setVoteCount] = useState(post.vote_count);

  const voteMutation = useMutation({
    mutationFn: () => api.votePost(post.id),
    onMutate: () => {
      // Toggle optimistically
      const newVoted = !voted;
      setVoted(newVoted);
      setVoteCount((prev) => (newVoted ? prev + 1 : Math.max(0, prev - 1)));
    },
    onSuccess: (data) => {
      setVoted(data.voted);
      setVoteCount(data.vote_count);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
    onError: () => {
      // Revert on error
      setVoted(Boolean(post.has_voted));
      setVoteCount(post.vote_count);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePost(post.id),
    onSuccess: () => {
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.refetchQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to delete discussion.');
    },
  });

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    voteMutation.mutate();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsDeleteOpen(true);
  };

  return (
    <>
      <article
        id={`post-card-${post.id}`}
        className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all duration-200 text-slate-800"
      >
        {/* Pinned Tag */}
        {post.is_pinned && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 mb-3 w-fit">
            <Pin className="w-3.5 h-3.5 rotate-45 text-amber-600" />
            <span>Pinned</span>
          </div>
        )}

        {/* Header: Author Pseudonym & Role */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/u/${post.author.id}`} className="hover:opacity-90 transition-opacity">
              <Avatar
                seed={post.author.avatar_seed}
                pseudonym={post.author.pseudonym}
                size="md"
              />
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/u/${post.author.id}`}
                className="font-medium text-slate-900 text-sm hover:text-indigo-600 transition-colors"
              >
                {post.author.pseudonym}
              </Link>
            </div>
          </div>
        </div>

        {/* Content: Title & Body Preview */}
        <Link href={`/post/${post.id}`} className="block group-hover:text-indigo-950">
          <h3 className="text-base font-semibold text-slate-900 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3 whitespace-pre-line">
            {post.body}
          </p>
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <TagIcon className="w-2.5 h-2.5 opacity-50" />
                <span>{tag}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {/* Upvote Button */}
            <button
              id={`btn-vote-post-${post.id}`}
              type="button"
              onClick={handleVote}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                voted
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowBigUp className={`w-4 h-4 ${voted ? 'fill-white' : ''}`} />
              <span>{voteCount}</span>
            </button>

            {/* Replies Link */}
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}</span>
            </Link>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {hasCopied && <span className="text-[11px] text-emerald-600 font-normal">Link copied</span>}
          </div>

          <div className="flex items-center gap-1">
            {isAuthor && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(post)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {(isAuthor || isModerator) && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id={`btn-report-post-${post.id}`}
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setIsReportOpen(true);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
              title="Report"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>

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
        message="Are you sure you want to delete this question? This action will remove the discussion and its replies."
        confirmLabel="Delete Question"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
}
