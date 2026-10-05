import React, { useState } from 'react';
import { X, ZoomIn, RotateCw, Move } from 'lucide-react';

interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (adjustments: { scale: number; offsetX: number; offsetY: number; rotation: number }) => void;
  initialValues?: { scale: number; offsetX: number; offsetY: number; rotation: number };
}

export const AdjustModal: React.FC<AdjustModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialValues = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 },
}) => {
  const [scale, setScale] = useState(initialValues.scale);
  const [offsetX, setOffsetX] = useState(initialValues.offsetX);
  const [offsetY, setOffsetY] = useState(initialValues.offsetY);
  const [rotation, setRotation] = useState(initialValues.rotation);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({ scale, offsetX, offsetY, rotation });
    onClose();
  };

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Adjust Photo</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 py-4">
          {/* Zoom Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-purple-600" /> Zoom
              </span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Horizontal Position */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-purple-600" /> Horizontal Shift
              </span>
              <span>{Math.round(offsetX * 100)}</span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.02"
              value={offsetX}
              onChange={(e) => setOffsetX(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Vertical Position */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-purple-600" /> Vertical Shift
              </span>
              <span>{Math.round(offsetY * 100)}</span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.02"
              value={offsetY}
              onChange={(e) => setOffsetY(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-purple-600" /> Rotation
              </span>
              <span>{rotation}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl brand-gradient text-white text-xs font-semibold shadow-md shadow-purple-500/20 hover:opacity-95 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
