import React from 'react';
import { StudentRole } from '../shared/types.js';

interface RoleBadgeProps {
  role: StudentRole;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleLabelMap: Record<StudentRole, string> = {
    Senior: 'Senior',
    Alumni: 'Alumni',
    Moderator: 'Moderator',
    Junior: 'Junior',
  };

  const label = roleLabelMap[role] || role;

  return (
    <span
      id={`tag-${role.toLowerCase()}`}
      className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 inline-block leading-tight"
    >
      {label}
    </span>
  );
}

