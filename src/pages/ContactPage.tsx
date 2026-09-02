import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send, CheckCircle, MessageSquare, Shield, HelpCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api.js';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; subject: string; message: string }) =>
      api.submitContact(payload),
    onSuccess: () => {
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit contact message. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    contactMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <Mail className="w-3.5 h-3.5" />
          <span>Support & Feedback</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact the Let’s Connect Team
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Have suggestions for the platform, questions regarding moderation decisions, or interested in becoming a verified senior mentor?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-slate-800">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Message Received</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out. Our student moderation and peer-mentorship coordination team at Aditya University will review your message.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="px-5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="input-contact-name"
                    type="text"
                    required
                    placeholder="e.g. Student Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    University Email
                  </label>
                  <input
                    id="input-contact-email"
                    type="email"
                    required
                    placeholder="rollno@aditya.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  id="input-contact-subject"
                  type="text"
                  required
                  placeholder="e.g. Mentorship feedback, Bug report, Category suggestion"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  id="textarea-contact-message"
                  required
                  rows={5}
                  minLength={10}
                  placeholder="Describe your inquiry, suggestion, or escalation..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-contact-submit"
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 shadow-md shadow-indigo-100 transition-colors flex items-center gap-2"
                >
                  {contactMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-slate-800">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Moderation & Safety Appeals</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If a post or comment of yours was flagged in error, or you wish to report urgent campus safety concerns, contact the student coordinator team directly.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-6 border border-indigo-100 shadow-xs space-y-3 text-indigo-950">
            <h3 className="font-bold text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Aditya University Campus Hub</span>
            </h3>
            <div className="text-xs space-y-1 text-slate-700">
              <p><strong>Campus:</strong> Aditya University, Surampalem, Andhra Pradesh</p>
              <p><strong>Domain:</strong> @aditya.ac.in & @aec.edu.in</p>
              <p><strong>Platform:</strong> Student Peer Mentorship Initiative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
