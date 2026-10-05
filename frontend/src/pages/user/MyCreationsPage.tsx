import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Share2, Trash2, Sparkles, Heart } from 'lucide-react';
import { useCreatives } from '../../contexts/CreativesContext';
import { CanvasRenderer } from '../../services/canvasRenderer';
import { ShareModal } from '../../components/modals/ShareModal';
import { StoryCard } from '../../components/common/StoryCard';

export const MyCreationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { creations, deleteCreation, favorites, templates } = useCreatives();
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'favorites'>('images');
  const [shareItem, setShareItem] = useState<{ title: string; url: string } | null>(null);

  const favoriteTemplates = templates.filter((t) => favorites.includes(t.id));
  const imageCreations = creations.filter((c) => c.type !== 'video');
  const videoCreations = creations.filter((c) => c.type === 'video');

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          My Creations
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Your personalized social stories saved and ready for export
        </p>
      </div>

      {/* Tabs matching Storyboard Reference */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('images')}
          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'images'
              ? 'brand-gradient text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Images ({imageCreations.length})
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'videos'
              ? 'brand-gradient text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Videos ({videoCreations.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'favorites'
              ? 'brand-gradient text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Favorites ({favoriteTemplates.length})
        </button>
      </div>

      {/* Tab Content: Images */}
      {activeTab === 'images' && (
        <>
          {imageCreations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {imageCreations.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 aspect-[9/16] bg-gray-100 border border-gray-100 flex flex-col justify-between"
                >
                  <img
                    src={item.outputUrl}
                    alt={item.templateName}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Actions overlay */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => CanvasRenderer.downloadDataUrl(item.outputUrl, `story-${item.id}.png`)}
                      className="p-2.5 rounded-full bg-white text-gray-800 hover:scale-110 transition shadow-md"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShareItem({ title: item.templateName, url: item.outputUrl })}
                      className="p-2.5 rounded-full bg-white text-gray-800 hover:scale-110 transition shadow-md"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCreation(item.id)}
                      className="p-2.5 rounded-full bg-rose-500 text-white hover:scale-110 transition shadow-md"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800">Your creations will appear here</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Pick any template, personalize it with your photo, and save or export in one click!
              </p>
              <button
                onClick={() => navigate('/home')}
                className="px-6 py-3 rounded-full brand-gradient text-white text-xs font-bold shadow-md"
              >
                Explore Templates
              </button>
            </div>
          )}
        </>
      )}

      {/* Tab Content: Videos */}
      {activeTab === 'videos' && (
        <div className="py-20 text-center space-y-3">
          <p className="text-sm font-bold text-gray-800">No exported videos yet</p>
          <p className="text-xs text-gray-500">
            Render dynamic motion clips in the Video Stories tab.
          </p>
          <button
            onClick={() => navigate('/video-stories')}
            className="px-6 py-2.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold hover:bg-purple-200 transition"
          >
            Go to Video Stories
          </button>
        </div>
      )}

      {/* Tab Content: Favorites */}
      {activeTab === 'favorites' && (
        <>
          {favoriteTemplates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {favoriteTemplates.map((template) => (
                <StoryCard
                  key={template.id}
                  template={template}
                  onClick={() => navigate(`/template/${template.id}`)}
                  showDetails={true}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <Heart className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-800">No favorites yet</p>
              <p className="text-xs text-gray-500">Tap the heart on any story to bookmark it here.</p>
            </div>
          )}
        </>
      )}

      {shareItem && (
        <ShareModal
          isOpen={Boolean(shareItem)}
          onClose={() => setShareItem(null)}
          title={shareItem.title}
          imageUrl={shareItem.url}
        />
      )}
    </div>
  );
};
