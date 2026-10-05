import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';
import { StoryCard } from '../../components/common/StoryCard';

export const TemplateGridPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { templates, categories } = useCreatives();

  const currentCategory = categories.find(
    (c) => c.slug.toLowerCase() === (slug || 'morning').toLowerCase()
  ) || categories[0];

  const [activeTag, setActiveTag] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filterChips = ['All', 'Nature', 'Positive', 'Quotes', 'Coffee', 'Trending'];

  // Filter templates belonging to this category
  let categoryTemplates = templates.filter(
    (t) => t.category.toLowerCase() === currentCategory.slug.toLowerCase()
  );

  // Filter by tag
  if (activeTag !== 'All') {
    categoryTemplates = categoryTemplates.filter((t) =>
      t.tags?.some((tag) => tag.toLowerCase() === activeTag.toLowerCase())
    );
  }

  // Filter by search
  if (search.trim()) {
    const q = search.toLowerCase();
    categoryTemplates = categoryTemplates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.headline?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Top Bar with Back, Category Name & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span>{currentCategory.icon}</span> {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {categoryTemplates.length} Personalized Templates
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${currentCategory.name}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Filter Chips (Exact match to storyboard) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterChips.map((chip) => {
          const isActive = activeTag === chip;
          return (
            <button
              key={chip}
              onClick={() => setActiveTag(chip)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'brand-gradient text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* 9:16 Template Cards Grid (2-cols on mobile, 4 or 5 on desktop) */}
      {categoryTemplates.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
          {categoryTemplates.map((template) => (
            <StoryCard
              key={template.id}
              template={template}
              onClick={() => navigate(`/template/${template.id}`)}
              showDetails={true}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400">
          <p className="text-sm">No templates found matching your search.</p>
        </div>
      )}
    </div>
  );
};
