import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatives } from '../../contexts/CreativesContext';
import { StoryCard } from '../../components/common/StoryCard';
import { ReligionType } from '../../types';

export const HomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();
  const { templates, categories, trendingTopics } = useCreatives();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showReligionSelector, setShowReligionSelector] = useState(false);

  React.useEffect(() => {
    if (user && !user.religion) {
      updateUserProfile({ religion: 'hindu' }).catch(() => {});
    }
  }, [user]);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const userReligion: ReligionType = user?.religion || 'hindu';

  const religionMeta: Record<ReligionType, { title: string; icon: string; badgeColor: string }> = {
    hindu: { title: 'Hindu', icon: '🕉️', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    muslim: { title: 'Muslim', icon: '☪️', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    sikh: { title: 'Sikh', icon: '☬', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' },
    christian: { title: 'Christian', icon: '✝️', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  };

  const currentRelMeta = religionMeta[userReligion] || religionMeta.hindu;

  // Filter templates strictly by the user's selected community preference
  const communityFilteredTemplates = templates.filter((t) => {
    // If template has specific religion tag, check match
    if (t.religion && t.religion !== 'all') {
      return t.religion === userReligion;
    }
    // If template category matches one of the 4 religions
    const catLower = t.category.toLowerCase();
    if (['hindu', 'muslim', 'sikh', 'christian'].includes(catLower)) {
      return catLower === userReligion;
    }
    // General non-religious categories (birthday, political, jokes, motivation, suvichar, good morning) are available to everyone
    return true;
  });

  // Dynamic chips list from Admin-managed Categories & Trending Topics + User Religion
  const publishedCats = (categories || [])
    .filter((c) => c.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const publishedTopics = (trendingTopics || [])
    .filter((t) => t.isPublished)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Combine unique chips
  const seenSlugs = new Set<string>(['all', userReligion]);
  const chips: Array<{ label: string; value: string; icon: string }> = [
    { label: 'All', value: 'all', icon: '' },
    { label: `${currentRelMeta.icon} ${currentRelMeta.title}`, value: userReligion, icon: '' },
  ];

  // Add trending topics
  publishedTopics.forEach((t) => {
    const slug = t.slug || t.name.toLowerCase().replace(/\s+/g, '-');
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      chips.push({ label: t.name, value: slug, icon: t.icon || '🔥' });
    }
  });

  // Add published categories
  publishedCats.forEach((c) => {
    const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      chips.push({ label: c.name, value: slug, icon: c.icon || '✨' });
    }
  });

  // Category filter matching
  const filteredTemplates = selectedCategory === 'all'
    ? communityFilteredTemplates
    : communityFilteredTemplates.filter((t) => {
        const cat = (t.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        const selClean = sel.replace(/-/g, ' ');
        const catClean = cat.replace(/-/g, ' ');
        return (
          cat === sel ||
          catClean === selClean ||
          cat.includes(sel) ||
          sel.includes(cat) ||
          catClean.includes(selClean) ||
          selClean.includes(catClean) ||
          (t.religion && t.religion === selectedCategory) ||
          (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(sel) || tag.toLowerCase().includes(selClean)))
        );
      });

  const limit = selectedCategory === 'all' ? 2 : undefined;
  const isPost = (t: any) => t.format === 'post';

  const isDevotional = (t: any) => {
    const c = t.category.toLowerCase();
    return c === userReligion || c === 'devotion' || c === 'bhagwan' || t.religion === userReligion;
  };

  // Trending items (excluding devotionals to avoid exact duplicate headers)
  const nonDevotionalTemplates = filteredTemplates.filter((t) => !isDevotional(t));
  const trendingPosts = (nonDevotionalTemplates.filter(isPost).length > 0 ? nonDevotionalTemplates.filter(isPost) : filteredTemplates.filter(isPost)).slice(0, limit);
  const trendingStories = (nonDevotionalTemplates.filter((t) => !isPost(t)).length > 0 ? nonDevotionalTemplates.filter((t) => !isPost(t)) : filteredTemplates.filter((t) => !isPost(t))).slice(0, limit);

  // Faith Devotionals (Images & Videos)
  const devotionalImages = communityFilteredTemplates
    .filter((t) => isDevotional(t) && t.type === 'image')
    .slice(0, limit);

  const devotionalVideos = communityFilteredTemplates
    .filter((t) => isDevotional(t) && t.type === 'video')
    .slice(0, limit);

  // Category specific sections dynamically populated from live categories & topics
  const categorySections = [
    { title: `${currentRelMeta.title} Devotional`, value: [userReligion, 'devotion', 'bhagwan'], emoji: currentRelMeta.icon },
    ...publishedCats.map((c) => ({
      title: c.name,
      value: [c.slug, c.name.toLowerCase(), c.slug.replace(/-/g, ' '), c.name.toLowerCase().replace(/\s+/g, '')],
      emoji: c.icon || '✨',
    })),
  ];

  const handleSwitchReligion = async (rel: ReligionType) => {
    setShowReligionSelector(false);
    await updateUserProfile({ religion: rel });
  };

  const renderGrid = (title: string, data: typeof templates, emoji?: string) => {
    if (data.length === 0) return null;
    const gridClass = "grid grid-cols-2 gap-3.5 sm:gap-5";

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            {title} {emoji && <span className="text-base">{emoji}</span>}
          </h2>
          <button
            onClick={() => navigate('/categories')}
            className="text-xs sm:text-sm font-semibold text-[#F72585] hover:underline flex items-center gap-1"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className={gridClass}>
          {data.map((tmpl) => (
            <StoryCard
              key={tmpl.id}
              template={tmpl}
              onClick={() => navigate(`/template/${tmpl.id}`)}
              showDetails={true}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6 select-none pb-12">
      
      {/* Greeting Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Good Morning, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Personalized creative feed tailored for you
          </p>
        </div>

        {/* Personalized Community Badge with Quick Switch */}
        <div className="relative">
          <button
            onClick={() => setShowReligionSelector(!showReligionSelector)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs hover:opacity-90 transition ${currentRelMeta.badgeColor}`}
            title="Switch Community Feed"
          >
            <span className="text-sm">{currentRelMeta.icon}</span>
            <span>{currentRelMeta.title}</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {/* Dropdown Menu for Community Switch */}
          {showReligionSelector && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select Community
              </div>
              {(['hindu', 'muslim', 'sikh', 'christian'] as ReligionType[]).map((rel) => {
                const meta = religionMeta[rel];
                const isCurrent = userReligion === rel;
                return (
                  <button
                    key={rel}
                    onClick={() => handleSwitchReligion(rel)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-left ${
                      isCurrent
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{meta.icon}</span>
                      <span>{meta.title}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Chips Filter */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {chips.map((chip, index) => {
          const isActive = selectedCategory === chip.value;
          return (
            <button
              key={`${chip.value}-${index}`}
              onClick={() => setSelectedCategory(chip.value)}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#403163] text-white border border-[#403163] shadow-xs'
                  : 'bg-white text-[#403163] border border-[#d6cce5] hover:bg-[#f8f6fb]'
              }`}
            >
              {chip.icon && <span className="text-[11px] -mr-0.5">{chip.icon}</span>}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Feed Sections */}
      {selectedCategory === 'all' ? (
        <div className="space-y-8">
          {/* 1. Community Devotional Images (Hindu / Muslim / Sikh / Christian) */}
          {devotionalImages.length > 0 && renderGrid(`${currentRelMeta.title} Devotional Images`, devotionalImages, currentRelMeta.icon)}

          {/* 2. Community Devotional Videos (Hindu / Muslim / Sikh / Christian) */}
          {devotionalVideos.length > 0 && renderGrid(`${currentRelMeta.title} Video Status`, devotionalVideos, '🕊️')}

          {/* 3. Trending Posts */}
          {trendingPosts.length > 0 && renderGrid('Trending Posts', trendingPosts, '🔥')}

          {/* 4. Trending Stories */}
          {trendingStories.length > 0 && renderGrid('Trending Stories', trendingStories, '✨')}

          {/* 5+. Other Category Specific Sections */}
          {categorySections.slice(1).map((sec) => {
            const secItems = communityFilteredTemplates
              .filter((t) => sec.value.some((val) => t.category.toLowerCase().includes(val)))
              .slice(0, limit);
            return (
              <React.Fragment key={sec.title}>
                {renderGrid(sec.title, secItems, sec.emoji)}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <span className="text-4xl">🎨</span>
              <h3 className="text-base font-bold text-gray-700">Templates Coming Soon</h3>
              <p className="text-xs text-gray-400">New designs are being added daily for this category.</p>
            </div>
          ) : (
            <>
              {filteredTemplates.filter(t => !isPost(t)).length > 0 && renderGrid(
                `${chips.find(c => c.value === selectedCategory)?.label || selectedCategory} Stories`,
                filteredTemplates.filter(t => !isPost(t)),
                '✨'
              )}
              {filteredTemplates.filter(isPost).length > 0 && renderGrid(
                `${chips.find(c => c.value === selectedCategory)?.label || selectedCategory} Posts`,
                filteredTemplates.filter(isPost),
                '🔥'
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
};
