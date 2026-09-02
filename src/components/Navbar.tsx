import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Users,
  Compass,
  Layers,
  Info,
  Mail,
  Shield,
  PlusCircle,
  LogOut,
  LogIn,
  User,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Avatar } from './Avatar.js';
import { RoleBadge } from './RoleBadge.js';

export function Navbar() {
  const [location] = useLocation();
  const { user, logout, openAuthModal, openCreatePostModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Users },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return (
        location === '/' ||
        location === '/home' ||
        location === '/lets-connect' ||
        location === '/lets-connect/' ||
        location === '/lets-connect/home'
      );
    }
    return location === href || location === `/lets-connect${href}`;
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 font-semibold text-lg tracking-tight group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="leading-none text-slate-900 font-semibold">LET'S CONNECT</span>
                <span className="text-[10px] font-normal tracking-wider uppercase text-indigo-600 mt-0.5">
                  Aditya University
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isRouteActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-normal transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Moderator Dashboard Tab */}
              {user?.role === 'Moderator' && (
                <Link
                  href="/moderation"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    isRouteActive('/moderation')
                      ? 'bg-purple-100 text-purple-800'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Moderation</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button
                  id="btn-nav-create-post"
                  onClick={openCreatePostModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ask Question</span>
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Authenticated User Pill */}
                <Link
                  href={`/u/${user.id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <Avatar seed={user.avatar_seed} pseudonym={user.pseudonym} size="sm" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-slate-800 leading-tight">
                      {user.pseudonym}
                    </span>
                    <span className="text-[10px] text-slate-500">{user.role}</span>
                  </div>
                </Link>

                <button
                  id="btn-nav-logout"
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => openAuthModal('register')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Join Platform</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <button
                onClick={openCreatePostModal}
                className="p-2 text-white bg-indigo-600 rounded-xl"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            )}
            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Link
                href={`/u/${user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <Avatar seed={user.avatar_seed} pseudonym={user.pseudonym} size="md" />
                <div>
                  <div className="text-sm font-bold text-slate-900">{user.pseudonym}</div>
                  <RoleBadge role={user.role} size="sm" />
                </div>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isRouteActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {user?.role === 'Moderator' && (
              <Link
                href="/moderation"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isRouteActive('/moderation')
                    ? 'text-purple-800 bg-purple-100'
                    : 'text-purple-700 bg-purple-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Moderator Dashboard</span>
              </Link>
            )}
          </div>

          {!user && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
              >
                Create University Account
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
