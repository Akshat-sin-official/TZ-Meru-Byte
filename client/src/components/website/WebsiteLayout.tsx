import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import ScrollToTopButton from './ScrollToTopButton';

interface WebsiteLayoutProps {
  children: React.ReactNode;
}

const WebsiteLayout: React.FC<WebsiteLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <ScrollToTop />
      <Header />
      <main
        className="flex-1 flex flex-col w-full"
        style={{
          paddingTop: 'var(--website-header-height, 80px)',
        }}
      >
        {children}
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default WebsiteLayout;

