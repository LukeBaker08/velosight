
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
          <div className="flex items-center">
            <Link to="/" className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xl tracking-tight">VeloSight</span>
                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-md font-medium">ALPHA</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">powered by</span>
                <img 
                  src="/lovable-uploads/32ffcb61-b8d7-4e98-846c-0ac6396790ea.png" 
                  alt="FIDERE" 
                  className="h-3"
                />
              </div>
            </Link>
            <nav className="ml-10 hidden md:flex items-center space-x-4">
              <Link to="/" className="text-foreground/80 hover:text-foreground px-3 py-2 text-sm font-medium flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/projects" className="text-foreground/80 hover:text-foreground px-3 py-2 text-sm font-medium">
                Projects
              </Link>
              <Link to="/knowledge" className="text-foreground/80 hover:text-foreground px-3 py-2 text-sm font-medium">
                Knowledge Repository
              </Link>
             </nav>
          </div>
          <div className="flex items-center space-x-4">
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
