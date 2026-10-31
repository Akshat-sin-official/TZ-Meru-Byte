import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export const DashboardLayout = ({ children, sidebar }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {sidebar}
        <main className="flex-1 overflow-x-hidden bg-background">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
