
/**
 * Application entry point that initializes the React root and renders the main App component.
 * Sets up the DOM mounting point and global styles.
 */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize React 18 root and render the main application
createRoot(document.getElementById("root")!).render(
  <App />
);
