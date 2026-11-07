import React, { useState } from 'react';
import { VideoAnalysisResult, YouTubeSource } from '../types/lesson';
import { Video, Sparkles, Check, X, Loader2, PlayCircle, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  onAddVideoResource: (video: YouTubeSource) => void;
}

export const VideoAnalysisModal: React.FC<Props> = ({
  isOpen,
  onClose,
  topicTitle,
  onAddVideoResource,
}) => {
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=iYM2zFP3Zn0');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!videoUrl) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          topicContext: topicTitle || 'HTTP Requests and Responses',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        setErrorMsg(data.error || 'Video analysis failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to analyze video.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddResource = () => {
    if (!analysisResult) return;
    const newSource: YouTubeSource = {
      title: analysisResult.videoSummary.slice(0, 60) + '...',
      channel: 'Verified Educational Creator',
      approxDuration: '15 minutes',
      recommendedClip: analysisResult.timestampSegments[0]
        ? `Timestamp ${analysisResult.timestampSegments[0].timestamp}: ${analysisResult.timestampSegments[0].concept}`
        : 'Watch introductory 5 minutes',
      searchQueryOrUrl: videoUrl,
      embedQuery: topicTitle,
    };
    onAddVideoResource(newSource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2f4a]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950 text-teal-300 border border-teal-800">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Video Understanding (Gemini Intelligence)</h3>
              <p className="text-xs text-slate-400">Analyze YouTube or lecture video for 45-min curriculum alignment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Input URL */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Educational Video URL / YouTube Lecture</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results Display */}
        {analysisResult && (
          <div className="space-y-4 pt-2 border-t border-[#1e2f4a]">
            <div className="p-4 bg-[#0b121f] rounded-xl border border-[#1e2f4a] space-y-2">
              <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Pedagogical Video Summary
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {analysisResult.videoSummary}
              </p>
              <div className="text-xs text-slate-300 flex items-center gap-2 pt-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>45-Min Timing Fit:</span>
                <span className="font-semibold text-teal-300">{analysisResult.suitabilityFor45MinLesson}</span>
              </div>
            </div>

            {/* Key Timestamp Segments */}
            {analysisResult.timestampSegments && analysisResult.timestampSegments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Key Teaching Segments & Timestamps:</div>
                <div className="space-y-1.5">
                  {analysisResult.timestampSegments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#0b121f] rounded-lg border border-[#1e2f4a] flex items-start justify-between text-xs gap-3"
                    >
                      <div className="flex items-start gap-2">
                        <PlayCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-white">{seg.concept}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{seg.pedagogicalValue}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-teal-300 shrink-0 font-bold">
                        {seg.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2f4a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          {analysisResult && (
            <button
              onClick={handleAddResource}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Add as Supplementary Resource</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
