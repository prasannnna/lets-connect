import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { PostCard } from '../components/PostCard.js';
import { Category, Post } from '../shared/types.js';

export function HomePage() {
  const { user, openCreatePostModal, openAuthModal } = useAuth();
  const [tab, setTab] = useState<'trending' | 'latest' | 'top'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch Categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Fetch Feed Posts
  const { data: feedData, isLoading } = useQuery({
    queryKey: ['feed', tab, selectedCategory, page],
    queryFn: () =>
      api.getFeed({
        tab,
        category: selectedCategory || undefined,
        page,
        limit: 10,
      }),
  });

  const posts = feedData?.posts || [];
  const pagination = feedData?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* University Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 mb-8 border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-normal text-indigo-300 mb-3 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Aditya University Anonymous Peer Mentorship</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-white mb-2.5">
            Ask Questions. Share Advice. <br className="hidden sm:inline" />
            <span className="text-indigo-300">Connect Without Exposing Your Identity.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            Get authentic guidance on campus placements, DSA roadmaps, and capstone projects from verified seniors and alumni using your pseudonymous identity.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <button
                id="btn-hero-create-post"
                onClick={openCreatePostModal}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ask Question</span>
              </button>
            ) : (
              <>
                <button
                  id="btn-hero-join"
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Join with @aditya.ac.in
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-xl text-sm font-normal bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Sign In
                </button>
              </>
            )}

            <Link
              href="/about"
              className="px-3 py-2 rounded-xl text-sm font-normal text-slate-300 hover:text-white transition-colors"
            >
              How anonymity works &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Center Column: Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Feed Controls: Tabs & Category Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Sort Tabs (plain text without emojis/icons) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  id="tab-trending"
                  onClick={() => {
                    setTab('trending');
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === 'trending'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Trending
                </button>

                <button
                  id="tab-latest"
                  onClick={() => {
                    setTab('latest');
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === 'latest'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Latest
                </button>

                <button
                  id="tab-top"
                  onClick={() => {
                    setTab('top');
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === 'top'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Top Voted
                </button>
              </div>

              {/* Quick Post Button */}
              {user && (
                <button
                  onClick={openCreatePostModal}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ask Question</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === ''
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Topics
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name} ({cat.posts_count || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Posts Feed Stream */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">No questions found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first student to ask a question or start a discussion in this topic.
              </p>
              <button
                onClick={user ? openCreatePostModal : () => openAuthModal('login')}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Ask a Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <div>
                    Page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span> ({pagination.total}{' '}
                    total questions)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-normal"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-normal"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Widgets (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Topics List Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-medium text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Topics</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/explore?category=${cat.slug}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-800 group-hover:text-indigo-600">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">
                      {cat.description}
                    </span>
                  </div>
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {cat.posts_count || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Student Mentorship Rules */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 text-slate-800">
            <div className="flex items-center gap-2 text-slate-900 font-medium text-sm">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Community Guidelines</span>
            </div>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-normal">•</span>
                <span>
                  <strong>Anonymous Freedom:</strong> Ask questions without fear of being judged.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-normal">•</span>
                <span>
                  <strong>Verified Senior Guidance:</strong> Senior and Alumni badges help you find trusted answers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-normal">•</span>
                <span>
                  <strong>Be Respectful:</strong> Keep discussions helpful and friendly.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
