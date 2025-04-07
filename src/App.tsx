
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { useCommentNotifications } from "@/hooks/useCommentNotifications";
import { removeLovableBadge, observeBadgeAddition } from "@/lib/badgeRemoval";
import "./App.css";

function App() {
  // This will initialize comment notifications at the app level
  // so that admins get notifications regardless of which page they're on
  useCommentNotifications();
  
  // Remove Lovable badge when the app loads and observe for future additions
  useEffect(() => {
    // First removal on load
    removeLovableBadge();
    
    // Set up observer to continuously remove if it gets added again
    const observer = observeBadgeAddition();
    
    // Clean up observer on component unmount
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
