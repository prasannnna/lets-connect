import React from 'react';
import { Link } from 'wouter';
import {
  ShieldCheck,
  Lock,
  Users,
  Award,
  BookOpen,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About Let’s Connect</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Aditya University's Safe, Anonymous Peer Mentorship Platform
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Designed specifically for students of Aditya University to ask honest questions, receive candid placement guidance, and learn from seniors without fear of social judgment.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Pseudonymous Privacy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your university email authenticates that you are a genuine Aditya student. However, all public posts and replies use a generated pseudonym (e.g., <em>TechTiger#879</em>). Your roll number and email are never exposed.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Verified Peer Hierarchy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            While identities remain pseudonymous, roles like <strong>Verified Senior</strong> and <strong>Verified Alumni</strong> are cryptographically authenticated so juniors know which advice comes from experienced peers.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zero Bullying Protection</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every submission is screened by our multi-layered content safety engine. Any harassment, personal attacks, or doxxing against faculty or students is blocked and flagged for moderator action.
          </p>
        </div>
      </div>

      {/* How It Works Diagrammatic Section */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-800">
        <h2 className="text-2xl font-bold text-slate-900">How the Anonymity Shield Operates</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Internal Architecture
            </div>
            <h4 className="text-base font-bold text-slate-900">Secured University Verification</h4>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sign up with your @aditya.ac.in or @aec.edu.in email</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password hashed with industry-standard bcrypt</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Stored in isolated internal database tables</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              Public Layer
            </div>
            <h4 className="text-base font-bold text-indigo-950">Pseudonymous Representation</h4>
            <ul className="text-xs space-y-2 text-indigo-900/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Only your generated pseudonym & avatar are public</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Verified role badge shows your academic level</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>API responses completely strip all email addresses</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5" />
          <span>University Code of Conduct</span>
        </div>
        <h2 className="text-2xl font-extrabold">Community Guidelines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="font-bold text-white">Be Constructive & Supportive</div>
            <p>Share genuine interview tips, study material, and career experiences that help juniors excel.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="font-bold text-white">No Defamation or Harassment</div>
            <p>Targeted attacks against faculty members, administrators, or fellow students are strictly prohibited.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="font-bold text-white">No Doxxing or Private Data</div>
            <p>Never reveal another student’s real identity, phone number, hostel room, or personal credentials.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="font-bold text-white">Report Violations Promptly</div>
            <p>Use the report button on any post or reply to immediately alert our student moderation team.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
