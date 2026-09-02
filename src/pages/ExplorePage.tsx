import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from 'wouter';
import {
  Search,
  Filter,
  Layers,
  Tag as TagIcon,
  Flame,
  Clock,
  TrendingUp,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { PostCard } from '../components/PostCard.js';
import { Category, Post } from '../shared/types.js';

export function ExplorePage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || '';
  const initialTag = searchParams.get('tag') || '';
  const initialSort = searchParams.get('sort') || 'trending';

  const [q, setQ] = useState(initialQ);
  const [searchInput, setSearchInput] = useState(initialQ);
  const [category, setCategory] = useState(initialCat);
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  // Sync state if URL query params change
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('category')) setCategory(params.get('category') || '');
    if (params.get('tag')) setTag(params.get('tag') || '');
    if (params.get('q')) {
      setQ(params.get('q') || '');
      setSearchInput(params.get('q') || '');
    }
  }, [searchString]);

  // Fetch Categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Fetch Search Results
  const { data: exploreData, isLoading } = useQuery({
    queryKey: ['explore', q, category, tag, sort, page],
    queryFn: () =>
      api.explore({
        q: q || undefined,
        category: category || undefined,
        tag: tag || undefined,
        sort,
        page,
        limit: 12,
      }),
  });

  const posts = exploreData?.posts || [];
  const pagination = exploreData?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setQ('');
    setSearchInput('');
    setCategory('');
    setTag('');
    setSort('trending');
    setPage(1);
  };

  const hasActiveFilters = Boolean(q || category || tag || sort !== 'trending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Explore Questions & Answers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search questions, interview experiences, project advice, and student discussions across Aditya University.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              id="input-explore-search"
              type="text"
              placeholder="Search by keywords, companies (Amazon, TCS), topics (React, DSA)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setQ('');
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            id="btn-explore-submit"
            type="submit"
            className="px-5 py-3 rounded-2xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filters Bar: Categories, Tag, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              id="select-explore-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Topics</option>
              {categories?.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              id="select-explore-sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="trending">Sort: Trending</option>
              <option value="latest">Sort: Latest</option>
              <option value="top">Sort: Top Voted</option>
              <option value="replies">Sort: Most Replies</option>
            </select>

            {tag && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTag('')}
                  className="hover:text-indigo-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-700">
          {isLoading ? (
            'Searching questions...'
          ) : (
            <>
              Found <span className="text-indigo-600 font-medium">{pagination?.total || 0}</span>{' '}
              questions
            </>
          )}
        </h2>
      </div>

      {/* Posts Results Stream */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-48"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No matching discussions found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
              <div>
                Page <span className="font-bold">{pagination.page}</span> of{' '}
                <span className="font-bold">{pagination.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
