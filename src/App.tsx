import React from 'react';
import { Route, Switch, Link } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { CreatePostModal } from './components/CreatePostModal.js';

import { HomePage } from './pages/HomePage.js';
import { PostDetailPage } from './pages/PostDetailPage.js';
import { ExplorePage } from './pages/ExplorePage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { ModeratorPage } from './pages/ModeratorPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />

          <main className="flex-1">
            <Switch>
              {/* Home Routes */}
              <Route path="/" component={HomePage} />
              <Route path="/home" component={HomePage} />
              <Route path="/lets-connect" component={HomePage} />
              <Route path="/lets-connect/home" component={HomePage} />

              {/* Post Detail Routes */}
              <Route path="/post/:id" component={PostDetailPage} />
              <Route path="/lets-connect/post/:id" component={PostDetailPage} />

              {/* Explore Routes */}
              <Route path="/explore" component={ExplorePage} />
              <Route path="/lets-connect/explore" component={ExplorePage} />

              {/* User Profile Routes */}
              <Route path="/u/:id" component={ProfilePage} />
              <Route path="/lets-connect/u/:id" component={ProfilePage} />

              {/* Moderation Routes */}
              <Route path="/moderation" component={ModeratorPage} />
              <Route path="/lets-connect/moderation" component={ModeratorPage} />

              {/* Static / Informational Routes */}
              <Route path="/about" component={AboutPage} />
              <Route path="/lets-connect/about" component={AboutPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/lets-connect/contact" component={ContactPage} />

              {/* 404 Fallback */}
              <Route>
                <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
                  <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
                  <p className="text-slate-600">This page does not exist or has been moved.</p>
                  <Link
                    href="/"
                    className="inline-block px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Back to Feed
                  </Link>
                </div>
              </Route>
            </Switch>
          </main>

          {/* Global Modals */}
          <AuthModal />
          <CreatePostModal />

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  LC
                </div>
                <span className="font-semibold text-slate-800">LET'S CONNECT</span>
                <span>— Anonymous Peer Mentorship Platform</span>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/about" className="hover:text-indigo-600 transition-colors">
                  About
                </Link>
                <Link href="/explore" className="hover:text-indigo-600 transition-colors">
                  Explore
                </Link>
                <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                  Contact
                </Link>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <span>Aditya University Student Community</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
