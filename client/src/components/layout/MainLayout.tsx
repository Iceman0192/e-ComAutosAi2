import { Sidebar } from './Sidebar';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}