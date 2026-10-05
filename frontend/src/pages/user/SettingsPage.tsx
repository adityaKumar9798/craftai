import React, { useState } from 'react';
import { Sliders, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [hdExport, setHdExport] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your account preferences, output resolution, and admin access
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> Preferences updated successfully!
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-bold text-gray-900 tracking-wide flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-600" /> Export & Story Preferences
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-800">High-Definition 1080×1920 Export</p>
              <p className="text-[11px] text-gray-500">Render crisp full-resolution stories for Instagram & WhatsApp</p>
            </div>
            <input
              type="checkbox"
              checked={hdExport}
              onChange={(e) => setHdExport(e.target.checked)}
              className="w-5 h-5 rounded text-purple-600 accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-3">
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-800">Notification Alerts</p>
              <p className="text-[11px] text-gray-500">Get notified when new seasonal festival templates arrive</p>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-purple-600 accent-purple-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
