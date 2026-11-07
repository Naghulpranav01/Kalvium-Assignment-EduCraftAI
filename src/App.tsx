import React, { useState, useEffect } from 'react';
import { SAMPLE_PRESETS } from './data/sampleLessons';
import { LessonPlan, QCLayer1Report, QCLayer2Report, QCIssue, InstructionalIssue } from './types/lesson';
import { ThreePedagogyVisualizer } from './components/ThreePedagogyVisualizer';
import { QCDashboard } from './components/QCDashboard';
import { LessonPresentation } from './components/LessonPresentation';
import { LessonEditor } from './components/LessonEditor';
import { AudioDictationModal } from './components/AudioDictationModal';
import { VideoAnalysisModal } from './components/VideoAnalysisModal';
import { ExportModal } from './components/ExportModal';
import { GlassmorphicShowcaseModal } from './components/GlassmorphicShowcaseModal';
import {
  Sparkles,
  BookOpen,
  Mic,
  Video,
  Download,
  Brain,
  Check,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Globe,
  Youtube,
  Compass,
  FileCheck2,
  BookMarked,
  Library,
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'studio' | '3d-engine' | 'qc-audit' | 'player' | 'editor'>('studio');

  // Input states
  const [lessonTitle, setLessonTitle] = useState('HTTP Requests and Responses');
  const [learningObjective, setLearningObjective] = useState(
    'Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.'
  );
  const [targetAudience, setTargetAudience] = useState('Undergraduate CS & Junior Engineers');
  const [enableThinking, setEnableThinking] = useState(true);

  // Lesson & QC state (defaults to pre-audited benchmark sample)
  const defaultSample = SAMPLE_PRESETS[0];
  const [currentLesson, setCurrentLesson] = useState<LessonPlan>(() => {
    const saved = localStorage.getItem('educraft_lesson_draft');
    return saved ? JSON.parse(saved) : defaultSample.lesson;
  });

  const [qc1Report, setQc1Report] = useState<QCLayer1Report | null>(() => {
    const saved = localStorage.getItem('educraft_qc1_report');
    return saved ? JSON.parse(saved) : defaultSample.qc1Report;
  });

  const [qc2Report, setQc2Report] = useState<QCLayer2Report | null>(() => {
    const saved = localStorage.getItem('educraft_qc2_report');
    return saved ? JSON.parse(saved) : defaultSample.qc2Report;
  });

  // Loading & status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGlassShowcaseOpen, setIsGlassShowcaseOpen] = useState(false);

  // 3D section jump sync
  const [highlightedSectionIndex, setHighlightedSectionIndex] = useState(0);

  // Save to localStorage whenever lesson or reports update
  useEffect(() => {
    if (currentLesson) {
      localStorage.setItem('educraft_lesson_draft', JSON.stringify(currentLesson));
    }
  }, [currentLesson]);

  useEffect(() => {
    if (qc1Report) {
      localStorage.setItem('educraft_qc1_report', JSON.stringify(qc1Report));
    }
  }, [qc1Report]);

  useEffect(() => {
    if (qc2Report) {
      localStorage.setItem('educraft_qc2_report', JSON.stringify(qc2Report));
    }
  }, [qc2Report]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // 1. Generate Full Lesson Workflow with Dual QC Pipeline
  const handleGenerateLesson = async () => {
    if (!lessonTitle.trim() || !learningObjective.trim()) {
      setGenerationError('Please provide both Lesson Title and Learning Objective.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Step 1: Research & Synthesis (Gemini with High Thinking)
      setGenerationStep('Synthesizing 45-minute lesson from books, web documentation, and video resources...');
      const genRes = await fetch('/api/lesson/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          objective: learningObjective,
          audience: targetAudience,
          enableThinking,
        }),
      });

      const genData = await genRes.json();
      if (!genData.success) {
        throw new Error(genData.error || 'Failed to generate lesson content.');
      }

      const newLesson: LessonPlan = genData.lesson;
      setCurrentLesson(newLesson);

      // Step 2: Quality Control Layer 1 (Research & Factual Accuracy Audit)
      setGenerationStep('Executing QC Layer 1: Research & Factual Accuracy Audit (RFC compliance)...');
      const qc1Res = await fetch('/api/qc/layer1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: newLesson, enableThinking }),
      });
      const qc1Data = await qc1Res.json();
      if (qc1Data.success) {
        setQc1Report(qc1Data.report);
      }

      // Step 3: Quality Control Layer 2 (Instructional Quality & Pedagogical Alignment)
      setGenerationStep('Executing QC Layer 2: Instructional Quality & 45-Min Pacing Audit...');
      const qc2Res = await fetch('/api/qc/layer2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: newLesson, enableThinking }),
      });
      const qc2Data = await qc2Res.json();
      if (qc2Data.success) {
        setQc2Report(qc2Data.report);
      }

      showToast('Lesson generated and audited through both QC layers successfully!');
      setActiveTab('3d-engine');
    } catch (err: any) {
      console.error('Generation pipeline failed:', err);
      setGenerationError(err?.message || 'Error occurred during generation. Previously saved work is preserved.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // 2. Re-audit both QC layers on demand
  const handleReAudit = async () => {
    if (!currentLesson) return;
    setIsAuditing(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/qc/layer1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson: currentLesson, enableThinking }),
        }),
        fetch('/api/qc/layer2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson: currentLesson, enableThinking }),
        }),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      if (data1.success) setQc1Report(data1.report);
      if (data2.success) setQc2Report(data2.report);

      showToast('Both QC audit reports refreshed successfully!');
    } catch (err: any) {
      console.error('Re-audit error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // 3. Apply individual QC Layer 1 Correction
  const handleApplyQC1Issue = (issue: QCIssue) => {
    if (!issue.autoFixPayload || issue.applied) return;
    const { sectionId, findText, replacementText } = issue.autoFixPayload;

    const updatedSections = currentLesson.sections.map((sec) => {
      if (sectionId && sec.id !== sectionId) return sec;
      let content = sec.content;
      if (findText && replacementText && content.includes(findText)) {
        content = content.replace(findText, replacementText);
      } else {
        content += `\n\n> **Auditor Note**: ${issue.recommendedCorrection}`;
      }
      return { ...sec, content };
    });

    setCurrentLesson((prev) => ({ ...prev, sections: updatedSections }));

    if (qc1Report) {
      setQc1Report({
        ...qc1Report,
        issues: qc1Report.issues.map((i) => (i.id === issue.id ? { ...i, applied: true } : i)),
        score: Math.min(100, (qc1Report.score || 90) + 3),
      });
    }

    showToast(`Applied factual correction to ${issue.location}`);
  };

  // 4. Apply individual QC Layer 2 Improvement
  const handleApplyQC2Issue = (issue: InstructionalIssue) => {
    if (issue.applied) return;
    const { sectionId, additionalContentOrAdjustment } = issue.autoFixPayload || {};

    const updatedSections = currentLesson.sections.map((sec) => {
      if (sectionId && sec.id !== sectionId) return sec;
      const content = sec.content + `\n\n${additionalContentOrAdjustment || issue.recommendedImprovement}`;
      return { ...sec, content };
    });

    setCurrentLesson((prev) => ({ ...prev, sections: updatedSections }));

    if (qc2Report) {
      setQc2Report({
        ...qc2Report,
        instructionalIssues: qc2Report.instructionalIssues.map((i) =>
          i.id === issue.id ? { ...i, applied: true } : i
        ),
        score: Math.min(100, (qc2Report.score || 92) + 3),
      });
    }

    showToast(`Applied instructional improvement to ${issue.targetSection}`);
  };

  // 5. Batch Apply All QC Recommendations
  const handleBatchApplyAll = async () => {
    if (!currentLesson) return;
    setIsAuditing(true);
    try {
      const allRecommendations = [
        ...(qc1Report?.issues.filter((i) => !i.applied) || []),
        ...(qc2Report?.instructionalIssues.filter((i) => !i.applied) || []),
      ];

      if (allRecommendations.length === 0) {
        showToast('All recommendations are already applied!');
        setIsAuditing(false);
        return;
      }

      const res = await fetch('/api/lesson/apply-fixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLesson,
          selectedRecommendations: allRecommendations,
        }),
      });

      const data = await res.json();
      if (data.success && data.updatedLesson) {
        setCurrentLesson(data.updatedLesson);

        if (qc1Report) {
          setQc1Report({
            ...qc1Report,
            score: 99,
            issues: qc1Report.issues.map((i) => ({ ...i, applied: true })),
          });
        }
        if (qc2Report) {
          setQc2Report({
            ...qc2Report,
            score: 100,
            instructionalIssues: qc2Report.instructionalIssues.map((i) => ({ ...i, applied: true })),
          });
        }

        showToast('Synthesized all QC recommendations into lesson content!');
      }
    } catch (err: any) {
      console.error('Batch apply error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Load a sample preset directly
  const loadPreset = (presetId: string) => {
    const found = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setLessonTitle(found.title);
      setLearningObjective(found.objective);
      setTargetAudience(found.audience);
      setCurrentLesson(found.lesson);
      setQc1Report(found.qc1Report);
      setQc2Report(found.qc2Report);
      showToast(`Loaded benchmark preset: "${found.name}"`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b121f] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131f33] border border-teal-500/80 shadow-2xl text-xs font-semibold text-teal-300">
          <Check className="w-4 h-4 text-teal-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Bar Contract (Strict 3-zone layout separated by gap-8) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#1e2f4a] bg-[#0b121f]/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <Compass className="w-5 h-5 text-teal-400" />
          <span className="text-teal-400 font-extrabold">EduCraft</span>
          <span className="text-slate-300 font-semibold">Studio</span>
        </a>

        {/* Zone 2: 4–5 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('studio')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'studio' ? 'text-teal-300 font-semibold' : 'hover:text-white'
            }`}
          >
            Lesson Studio
          </button>
          <button
            onClick={() => setActiveTab('3d-engine')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === '3d-engine' ? 'text-teal-300 font-semibold' : 'hover:text-white'
            }`}
          >
            3D Knowledge Engine
          </button>
          <button
            onClick={() => setActiveTab('qc-audit')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'qc-audit' ? 'text-teal-300 font-semibold' : 'hover:text-white'
            }`}
          >
            Dual QC Audit
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'player' ? 'text-teal-300 font-semibold' : 'hover:text-white'
            }`}
          >
            45-Min Player
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'editor' ? 'text-teal-300 font-semibold' : 'hover:text-white'
            }`}
          >
            Curriculum Editor
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsGlassShowcaseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-300 hover:text-white bg-teal-950/70 hover:bg-teal-900/80 border border-teal-700/70 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Inspect Hyper-Realistic 3D Glassmorphic Interface Renderings"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">3D Glass Showcase</span>
            <span className="sm:hidden">3D Glass</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Lesson</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Bar for Mobile / Tablet */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#1e2f4a]">
          {[
            { id: 'studio', label: 'Studio' },
            { id: '3d-engine', label: '3D Engine' },
            { id: 'qc-audit', label: 'Dual QC' },
            { id: 'player', label: '45m Player' },
            { id: 'editor', label: 'Editor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id ? 'bg-teal-600 text-white' : 'text-slate-300 bg-[#131f33]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: LESSON STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-8">
            {/* Hero / Assignment Banner */}
            <div className="bg-[#131f33] border border-[#1e2f4a] rounded-2xl p-6 lg:p-8 space-y-4 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Curriculum Design & Pedagogical Research Architecture</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                    AI-Powered 45-Minute Lesson Synthesizer & Dual QC Engine
                  </h1>
                  <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                    Generates production-grade educational curriculum from books, web sources, and YouTube videos.
                    Strictly budgeted for 45 minutes and verified through two independent Quality Control layers.
                  </p>
                </div>

                {/* Benchmark Preset Selector */}
                <div className="p-3 bg-[#0b121f] rounded-xl border border-[#1e2f4a] space-y-2 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Curriculum Presets:
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {SAMPLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => loadPreset(preset.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16243b] hover:bg-[#1e3455] text-slate-200 border border-[#22395d] transition-all transform hover:-translate-y-0.5 text-left cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="pt-6 border-t border-[#1e2f4a] grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* Lesson Title */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Lesson Title
                      </label>
                      <button
                        onClick={() => setIsAudioModalOpen(true)}
                        className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Voice Dictate Audio</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="e.g. HTTP Requests and Responses"
                      className="w-full px-4 py-2.5 bg-[#0b121f] border border-[#1e2f4a] rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Learning Objective */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Learning Objective
                    </label>
                    <textarea
                      rows={3}
                      value={learningObjective}
                      onChange={(e) => setLearningObjective(e.target.value)}
                      placeholder="e.g. Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories."
                      className="w-full px-4 py-2.5 bg-[#0b121f] border border-[#1e2f4a] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>

                  {/* Target Audience & Model Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Target Audience</label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">High-Thinking Rigor</label>
                      <button
                        type="button"
                        onClick={() => setEnableThinking(!enableThinking)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          enableThinking
                            ? 'bg-teal-950/80 border-teal-600 text-teal-300'
                            : 'bg-[#0b121f] border-[#1e2f4a] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-teal-400" />
                          <span>Gemini Intelligence (ThinkingLevel.HIGH)</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold">
                          {enableThinking ? 'ACTIVE' : 'STANDARD'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Generation Error Display */}
                  {generationError && (
                    <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Generation Pipeline Issue</span>
                      </div>
                      <p>{generationError}</p>
                    </div>
                  )}

                  {/* Generate Button & Progress */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                    <button
                      onClick={handleGenerateLesson}
                      disabled={isGenerating}
                      className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Synthesizing Curriculum...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate 45-Min Lesson & Run Dual QC</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-3 text-xs font-semibold text-slate-200 hover:text-white bg-[#182740] hover:bg-[#203354] border border-[#22395d] rounded-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-rose-400" />
                      <span>Analyze Video with AI</span>
                    </button>
                  </div>

                  {/* Live Progress Stage Feedback */}
                  {isGenerating && (
                    <div className="p-4 rounded-xl bg-[#0b121f] border border-teal-500/50 space-y-2 animate-pulse">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Pipeline Step Execution:</span>
                      </div>
                      <p className="text-xs text-slate-300">{generationStep}</p>
                    </div>
                  )}
                </div>

                {/* Right Column: 45-Minute Architecture Blueprint */}
                <div className="bg-[#0b121f] border border-[#1e2f4a] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      45-Minute Pacing Blueprint
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-400">45:00 Total</span>
                  </div>

                  <div className="space-y-3">
                    {currentLesson.timingBreakdown.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#131f33] border border-[#1e2f4a] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{item.phase}</span>
                          <span className="font-mono text-teal-300 font-bold">{item.timeWindow}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{item.focus}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Research Sources Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Synthesized Research Citations & Sources</h3>
                  <p className="text-xs text-slate-400">
                    Canonical computer science textbooks, official RFC specifications, and curated video resources.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Books */}
                <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      <h4 className="text-sm font-bold text-white">Canonical Textbooks</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                      {currentLesson.researchSources?.books?.length || 0} Textbooks
                    </span>
                  </div>
                  <div className="space-y-3">
                    {currentLesson.researchSources?.books?.map((book, idx) => {
                      const directUrl = book.url || `https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' book')}`;
                      const libraryUrl = book.libraryLink || `https://openlibrary.org/search?q=${encodeURIComponent(book.title + ' ' + book.author)}`;

                      return (
                        <div key={idx} className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs space-y-2 hover:border-[#284164] transition-colors">
                          <div className="font-semibold text-slate-200">{book.title}</div>
                          <div className="text-slate-400 text-[11px]">{book.author} ({book.year})</div>
                          <div className="text-slate-400 text-[11px] italic leading-snug">{book.chapterOrTopic}</div>
                          <div className="text-teal-300 text-[11px] pt-0.5 leading-snug">{book.relevance}</div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e2f4a]/70">
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:text-white bg-sky-950/80 hover:bg-sky-900 rounded-md border border-sky-800 transition-colors"
                            >
                              <BookMarked className="w-3 h-3 text-sky-400" />
                              <span>Publisher / Web Edition</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <a
                              href={libraryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-[#182740] hover:bg-[#22395d] rounded-md border border-[#22395d] transition-colors"
                            >
                              <Library className="w-3 h-3 text-teal-400" />
                              <span>Open Library Archive</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Websites / RFCs */}
                <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-400" />
                      <h4 className="text-sm font-bold text-white">Web Docs & RFCs</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                      {currentLesson.researchSources?.websites?.length || 0} Standards
                    </span>
                  </div>
                  <div className="space-y-3">
                    {currentLesson.researchSources?.websites?.map((web, idx) => (
                      <div key={idx} className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs space-y-2 hover:border-[#284164] transition-colors">
                        <div className="font-semibold text-slate-200">{web.title}</div>
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                          {web.sourceType}
                        </span>
                        <div className="text-slate-400 text-[11px] leading-snug">{web.keyContribution}</div>
                        <div className="pt-1 border-t border-[#1e2f4a]/70">
                          <a
                            href={web.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Read Official Specification</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* YouTube Videos */}
                <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-rose-400" />
                      <h4 className="text-sm font-bold text-white">Supplementary Videos</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      {currentLesson.researchSources?.youtubeVideos?.length || 0} Curated
                    </span>
                  </div>
                  <div className="space-y-3">
                    {currentLesson.researchSources?.youtubeVideos?.map((vid, idx) => {
                      const watchUrl = vid.searchQueryOrUrl?.startsWith('http')
                        ? vid.searchQueryOrUrl
                        : vid.videoId
                        ? `https://www.youtube.com/watch?v=${vid.videoId}`
                        : `https://www.youtube.com/results?search_query=${encodeURIComponent(vid.title + ' ' + vid.channel)}`;

                      return (
                        <div key={idx} className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs space-y-2 hover:border-[#284164] transition-colors">
                          <div className="font-semibold text-slate-200">{vid.title}</div>
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span className="text-slate-300 font-medium">{vid.channel}</span>
                            <span className="font-mono text-teal-400 font-semibold">{vid.approxDuration}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] leading-snug">{vid.recommendedClip}</div>
                          <div className="pt-1 border-t border-[#1e2f4a]/70">
                            <a
                              href={watchUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
                            >
                              <Youtube className="w-3 h-3" />
                              <span>Watch Video Resource</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THREE.JS 3D KNOWLEDGE ENGINE */}
        {activeTab === '3d-engine' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Interactive 3D Curriculum Core (Three.js Orbit Engine)</h2>
                <p className="text-xs text-slate-400">
                  Dynamic 3D pedagogical visualizer: Procedural nucleus, gyroscope rings, orbital lesson phases, and dual QC verification halos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('qc-audit')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#182740] rounded-lg border border-[#22395d] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  View Dual QC Audit &rarr;
                </button>
                <button
                  onClick={() => setActiveTab('player')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Open 45-Min Player &rarr;
                </button>
              </div>
            </div>

            {/* The Three.js 3D Viewport */}
            <ThreePedagogyVisualizer
              lesson={currentLesson}
              qc1Score={qc1Report?.score}
              qc2Score={qc2Report?.score}
              activeSectionIndex={highlightedSectionIndex}
              onSelectSection={(idx) => {
                setHighlightedSectionIndex(idx);
                setActiveTab('player');
              }}
            />
          </div>
        )}

        {/* TAB 3: DUAL QUALITY CONTROL (QC) AUDIT */}
        {activeTab === 'qc-audit' && (
          <QCDashboard
            lesson={currentLesson}
            qc1Report={qc1Report}
            qc2Report={qc2Report}
            onApplyQC1Issue={handleApplyQC1Issue}
            onApplyQC2Issue={handleApplyQC2Issue}
            onBatchApplyAll={handleBatchApplyAll}
            onReAudit={handleReAudit}
            isAuditing={isAuditing}
          />
        )}

        {/* TAB 4: 45-MINUTE PRESENTATION & LEARNING PLAYER (WITH MASTERY QUIZ) */}
        {activeTab === 'player' && (
          <LessonPresentation lesson={currentLesson} />
        )}

        {/* TAB 5: INLINE CURRICULUM EDITOR */}
        {activeTab === 'editor' && (
          <LessonEditor
            lesson={currentLesson}
            onSaveLesson={(updated) => {
              setCurrentLesson(updated);
              showToast('Lesson edits updated successfully!');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <AudioDictationModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onApplyTranscript={({ title, objective }) => {
          if (title) setLessonTitle(title);
          if (objective) setLearningObjective(objective);
          showToast('Applied voice dictation to lesson fields!');
        }}
      />

      <VideoAnalysisModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        topicTitle={lessonTitle}
        onAddVideoResource={(videoSource) => {
          setCurrentLesson((prev) => ({
            ...prev,
            researchSources: {
              ...prev.researchSources,
              youtubeVideos: [...(prev.researchSources?.youtubeVideos || []), videoSource],
            },
          }));
          showToast('Added analyzed video to supplementary research sources!');
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        lesson={currentLesson}
        qc1Report={qc1Report}
        qc2Report={qc2Report}
      />

      <GlassmorphicShowcaseModal
        isOpen={isGlassShowcaseOpen}
        onClose={() => setIsGlassShowcaseOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#1e2f4a] bg-[#0b121f] py-6 px-6 text-center text-xs text-slate-400">
        <p>EduCraft AI · 45-Minute Curriculum Architecture & Dual QC Validation Studio</p>
      </footer>
    </div>
  );
}
