import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Clock,
  MessageSquare,
  FileText,
  ShieldCheck,
  Award,
  ArrowLeft,
  Loader2,
  Lock,
} from 'lucide-react';
import { safeFormatDate, safeFormatDistanceToNow } from '../lib/dateUtils.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Avatar } from '../components/Avatar.js';
import { RoleBadge } from '../components/RoleBadge.js';
import { PostCard } from '../components/PostCard.js';
import { StudentPublic, Post } from '../shared/types.js';

export function ProfilePage() {
  const [matchStandard, paramsStandard] = useRoute<{ id: string }>('/u/:id');
  const [matchPrefixed, paramsPrefixed] = useRoute<{ id: string }>('/lets-connect/u/:id');
  const params = paramsStandard || paramsPrefixed;
  const { user: currentUser } = useAuth();
  const studentId = params && params.id ? parseInt(params.id, 10) : 0;
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  // Fetch Public Profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery<StudentPublic>({
    queryKey: ['user', studentId],
    queryFn: () => api.getUser(studentId),
    enabled: Boolean(studentId),
  });

  // Fetch User Posts
  const { data: posts = [], isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ['user-posts', studentId],
    queryFn: () => api.getUserPosts(studentId),
    enabled: Boolean(studentId),
  });

  // Fetch User Comments
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ['user-comments', studentId],
    queryFn: () => api.getUserComments(studentId),
    enabled: Boolean(studentId),
  });

  if (isProfileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Student Profile Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested pseudonymous profile does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Feed</span>
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?.id === profile.id;

  const formattedJoinDate = safeFormatDate(profile.created_at, 'MMMM yyyy', 'Recently');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Discussions</span>
      </Link>

      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 text-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Avatar
              seed={profile.avatar_seed}
              pseudonym={profile.pseudonym}
              size="xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900">{profile.pseudonym}</h1>
                <RoleBadge role={profile.role} size="md" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Joined {formattedJoinDate}</span>
                <span>•</span>
                <span>Aditya University Student</span>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Anonymous Profile</span>
          </div>
        </div>

        {/* Self Privacy Banner */}
        {isSelf && (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">This is your public pseudonymous profile.</p>
              <p className="text-indigo-700">
                Your real university email is never exposed to other students or visitors.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-2xl font-black text-slate-900">{profile.posts_count || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Discussions Started</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-2xl font-black text-slate-900">{profile.comments_count || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Peer Replies Given</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
            <div className="text-base font-bold text-indigo-700">{profile.role}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Verified Standing</div>
          </div>
        </div>
      </div>

      {/* Tabs: Posts vs Comments */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'posts'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Discussions ({posts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'comments'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Replies ({comments.length})</span>
          </button>
        </div>

        {activeTab === 'posts' ? (
          isPostsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-36" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
              No discussions created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )
        ) : (
          isCommentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-24" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
              No replies submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2 text-slate-800"
                >
                  <div className="text-xs text-slate-500">
                    Replied on:{' '}
                    <Link
                      href={`/post/${c.post_id}`}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      {c.post_title}
                    </Link>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {c.body}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    {safeFormatDistanceToNow(c.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
