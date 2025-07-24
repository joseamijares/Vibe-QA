import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-semibold">VibeQA Dashboard</h1>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
