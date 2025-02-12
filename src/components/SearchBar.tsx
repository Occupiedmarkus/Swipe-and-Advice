
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md mx-auto">
      <Input
        type="search"
        placeholder="Search videos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </form>
  );
};

export default SearchBar;
