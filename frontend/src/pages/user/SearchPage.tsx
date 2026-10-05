import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';
import { StoryCard } from '../../components/common/StoryCard';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { templates } = useCreatives();

  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSearchParams(val ? { q: val } : {});
  };

  const results = templates.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.headline?.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 select-none">
      {/* Search Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all 45+ story templates..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 font-medium">
          Showing {results.length} templates {searchTerm ? `for "${searchTerm}"` : ''}
        </p>
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
          {results.map((tmpl) => (
            <StoryCard
              key={tmpl.id}
              template={tmpl}
              onClick={() => navigate(`/template/${tmpl.id}`)}
              showDetails={true}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
          <p className="text-sm">No templates found matching "{searchTerm}".</p>
        </div>
      )}
    </div>
  );
};
