import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './surfaces.module.css';

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: 'wide' | 'form';
}

export function PageContainer({ width = 'wide', className, ...props }: PageContainerProps) {
  return <div className={cn(styles.page, 'mx-auto w-full min-w-0', width === 'form' ? 'max-w-3xl' : 'max-w-[1440px]', className)} {...props} />;
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
    <div className="min-w-0">
      {eyebrow && <p className={cn(styles.eyebrow, 'mb-2 text-text-muted')}>{eyebrow}</p>}
      <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">{description}</p>}
    </div>
    {action && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{action}</div>}
  </header>;
}

export function SectionHeader({ title, description, action }: Omit<PageHeaderProps, 'eyebrow' | 'className'>) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-text">{title}</h2>
      {description && <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>}
    </div>
    {action}
  </div>;
}
