import React from 'react';

interface AvatarProps {
  seed: string;
  pseudonym?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

export function Avatar({ seed, pseudonym = 'TechTiger#100', size = 'md', className = '' }: AvatarProps) {
  // Compute deterministic index from seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const gradientIndex = Math.abs(hash) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];

  // Get 2 letters for initials
  const cleanName = pseudonym.split('#')[0] || 'LC';
  const initials = cleanName.slice(0, 2).toUpperCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-20 h-20 text-2xl font-bold',
  };

  return (
    <div
      id={`avatar-${seed.replace(/[^a-zA-Z0-9]/g, '_')}`}
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-xs select-none shrink-0 ${sizeClasses[size]} ${className}`}
      title={pseudonym}
    >
      <span>{initials}</span>
      <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" />
    </div>
  );
}
