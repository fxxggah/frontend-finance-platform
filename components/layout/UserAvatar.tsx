'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';
import type { User } from '@/types';

export function UserAvatar({ user }: { user?: User }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (user?.pictureUrl && user.pictureUrl !== failedUrl) {
    return (
      <img
        src={user.pictureUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(user.pictureUrl)}
        className="size-full rounded-[inherit] object-cover"
      />
    );
  }

  return user?.name.trim()
    ? <span aria-hidden="true">{user.name.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span>
    : <UserRound className="size-5" aria-hidden="true" />;
}
