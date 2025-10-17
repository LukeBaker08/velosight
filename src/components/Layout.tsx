
/**
 * Layout wrapper component that provides consistent page structure with navigation and footer.
 * Maintains responsive design and proper spacing throughout the application.
 */

import React from 'react';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import { Folder, Book, HelpCircle, Mail } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component that wraps page content with navigation and footer
 * @param children - Page content to render within the layout structure
 * @returns JSX element with navbar, main content area, and footer
 */

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t py-4 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-6 text-sm">
              <Link to="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Folder className="h-4 w-4" />
                <span>Projects</span>
              </Link>
              <Link to="/knowledge" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Book className="h-4 w-4" />
                <span>Knowledge Repository</span>
              </Link>
              <Link to="/faq" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4" />
                <span>FAQs</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
