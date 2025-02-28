
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { useCommentNotifications } from "@/hooks/useCommentNotifications";
import "./App.css";

function App() {
  // This will initialize comment notifications at the app level
  // so that admins get notifications regardless of which page they're on
  useCommentNotifications();
  
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
