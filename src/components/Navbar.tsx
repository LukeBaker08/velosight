
/**
 * Navigation bar component providing app-wide navigation and user account management.
 * Features responsive design with dropdown menu for user actions and direct navigation links.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { HelpCircle, LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';

/**
 * Main navigation component with user authentication integration
 * @returns JSX element with navigation links and user dropdown menu
 */
const Navbar = () => {
  const { user, signOut } = useAuth();
  const userEmail = user?.email || 'Admin';
  const shortUserName = userEmail.split('@')[0];

  /**
   * Handles user logout by calling the auth signOut method
   */
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center min-w-[160px]">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-xl tracking-tight text-foreground">VeloSight</span>
                  <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">Beta</span>
                </div>
                <span className="text-[11px] text-muted-foreground tracking-wide">
                  by <span className="font-medium text-foreground/70">FIDERE</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation - Center */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1">
              <Link to="/" className="text-foreground/70 hover:text-foreground hover:bg-muted/50 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/projects" className="text-foreground/70 hover:text-foreground hover:bg-muted/50 px-4 py-2 text-sm font-medium rounded-md transition-colors">
                Projects
              </Link>
              <Link to="/knowledge" className="text-foreground/70 hover:text-foreground hover:bg-muted/50 px-4 py-2 text-sm font-medium rounded-md transition-colors">
                Knowledge
              </Link>
            </div>
          </nav>

          {/* User Menu - Right */}
          <div className="flex items-center justify-end min-w-[160px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1">
                  <span className="hidden md:inline-block">{shortUserName}</span>
                  <User className="h-5 w-5 md:ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to="/settings" className="flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/faq" className="flex w-full items-center">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>FAQs</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <button className="flex w-full items-center text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
