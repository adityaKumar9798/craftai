import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCreatives();
  const [search, setSearch] = useState('');

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Choose from over 1,000+ hand-crafted social media story templates
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Category Cards Grid (Exact match to storyboard: 2-col on mobile, 4 or 5 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/category/${cat.slug}`)}
            className="p-5 sm:p-6 rounded-3xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-gray-200/80 flex flex-col items-center text-center justify-center gap-2.5 group"
            style={{ backgroundColor: cat.backgroundColor }}
          >
            <span className="text-4xl sm:text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
              {cat.icon}
            </span>
            <div className="mt-1">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                {cat.name}
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                {cat.templateCount}+ Templates
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
