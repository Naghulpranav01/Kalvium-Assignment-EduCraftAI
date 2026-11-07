import React, { useState } from 'react';
import { X, Sparkles, Eye, Layers, ShieldCheck, Maximize2 } from 'lucide-react';
import frostedGlassImg from '../assets/images/frosted_glass_card_1794033489535.jpg';
import fluidTabImg from '../assets/images/fluid_tab_transition_1794033489538.jpg';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GlassmorphicShowcaseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeAsset, setActiveAsset] = useState<'card' | 'transition'>('card');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#0b121f] border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e2f4a] bg-[#131f33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-950 rounded-lg border border-teal-700/60 text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  Precision 3D Engineering
                </span>
                <span className="text-xs text-slate-400 font-mono">iOS-Class Glassmorphism</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Hyper-Realistic 3D Glassmorphic Interface Assets
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Asset Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#0b121f] rounded-lg border border-[#1e2f4a]">
              <button
                onClick={() => setActiveAsset('card')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeAsset === 'card'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Precision Frosted Glass Card
              </button>
              <button
                onClick={() => setActiveAsset('transition')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeAsset === 'transition'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Fluid Tab Switch Mid-Motion
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#182740] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Asset Showcase Display */}
          <div className="relative rounded-2xl overflow-hidden border border-[#1e2f4a] bg-black/60 shadow-2xl group">
            <img
              src={activeAsset === 'card' ? frostedGlassImg : fluidTabImg}
              alt={activeAsset === 'card' ? 'Precision Frosted Glass Card' : 'Fluid Tab Switch Mid-Motion'}
              className="w-full h-auto max-h-[480px] object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />

            <button
              onClick={() => setZoomImage(activeAsset === 'card' ? frostedGlassImg : fluidTabImg)}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Full Screen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0b121f]/85 backdrop-blur-md border border-white/10 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-sm block">
                  {activeAsset === 'card'
                    ? 'Floating Precision-Milled Frosted Glassmorphism Card'
                    : 'Fluid Tab Switch Mid-Motion Kinetic Transition'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {activeAsset === 'card'
                    ? 'Optical refraction, micro-bevel border highlights, subsurface scattering, and dual-layered ambient shadows.'
                    : 'Kinetic inertia stretching, directional motion blur, real-time background refraction shift, and luminous white text cross-fade.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-teal-950 text-teal-300 font-mono text-[10px] font-bold border border-teal-800">
                  8K Studio Master
                </span>
                <span className="px-2 py-1 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-800">
                  iOS Fluid Dynamics
                </span>
              </div>
            </div>
          </div>

          {/* Material & Physical Behavior Specifications Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#131f33] border border-[#1e2f4a] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Refraction & Blur</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Refractive lens warping deep midnight blues, vibrant amethysts, and soft neon magentas with digital backdrop-filter diffusion.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#131f33] border border-[#1e2f4a] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Micro-Bevel Highlight</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Razor-sharp polished white specular light-catch border defining thick 3D volume and separation from background layers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#131f33] border border-[#1e2f4a] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Subsurface Scattering</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Soft internal core radiance mimicking authentic photons traveling within the dense silicate volume before exiting.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#131f33] border border-[#1e2f4a] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <Eye className="w-3.5 h-3.5" />
                <span>Kinetic Inertia & Blur</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mid-transition morphing pill with directional motion blur and specular luminous text cross-fade.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1e2f4a] bg-[#131f33] flex items-center justify-between text-xs text-slate-400">
          <span>Rendered for EduCraft Design Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer transition-colors"
          >
            Close Showcase
          </button>
        </div>
      </div>

      {/* Fullscreen Zoom */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={zoomImage} alt="Fullscreen 3D Asset" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
};
