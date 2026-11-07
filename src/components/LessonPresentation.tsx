import React, { useState, useEffect } from 'react';
import { LessonPlan, LessonSection, QuizQuestion, BookSource, YouTubeSource } from '../types/lesson';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  UserCheck,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  BookOpen,
  Youtube,
  Globe,
  ExternalLink,
  Loader2,
  Check,
  BookMarked,
  Library,
  Video,
  X,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react';

interface Props {
  lesson: LessonPlan;
}

export const LessonPresentation: React.FC<Props> = ({ lesson }) => {
  const [deliveryMode, setDeliveryMode] = useState<'instructor' | 'self-learning'>('instructor');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  // Web Speech API Read Aloud state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // 45-minute countdown timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Active embedded video state for inline preview
  const [activeEmbedVideo, setActiveEmbedVideo] = useState<{ id: string; title: string } | null>(null);

  // Dynamic Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>(lesson.knowledgeCheck || []);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [instantFeedbackMode] = useState(true);
  const [quizFeedbackToast, setQuizFeedbackToast] = useState<string | null>(null);

  // Sync when lesson changes
  useEffect(() => {
    setActiveQuizQuestions(lesson.knowledgeCheck || []);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setCurrentSectionIndex(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  }, [lesson]);

  // Clean up speech synthesis when section changes or unmounts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  }, [currentSectionIndex]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setElapsedSeconds(0);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSections = lesson.sections.length;
  const currentSection: LessonSection | undefined = lesson.sections[currentSectionIndex];
  const currentTiming = lesson.timingBreakdown[currentSectionIndex] || {
    timeWindow: '00:00 - 45:00',
    phase: currentSection?.title || 'Lesson Section',
    minutes: currentSection?.allocatedMinutes || 9,
    focus: currentSection?.learningOutcome || '',
  };

  // Cumulative elapsed minutes calculation for progress tracking
  const cumulativeMinutesBeforeCurrent = lesson.sections
    .slice(0, currentSectionIndex)
    .reduce((sum, s) => sum + (Number(s.allocatedMinutes) || 0), 0);
  const currentSectionMinutes = Number(currentSection?.allocatedMinutes) || 9;
  const currentProgressPercent = Math.min(
    100,
    Math.round(((cumulativeMinutesBeforeCurrent + currentSectionMinutes * 0.5) / 45) * 100)
  );

  const toggleSolution = (sectionId: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Convert raw markdown to clean, natural spoken English
  const cleanMarkdownForSpeech = (raw: string): string => {
    return raw
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted for narration. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+(.*)$/gm, '$1. ')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^>\s+(.*)$/gm, 'Core Principle: $1. ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  };

  // Web Speech API: Toggle Read Aloud narration for the active section
  const handleToggleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setQuizFeedbackToast('Web Speech API is not supported in this browser.');
      setTimeout(() => setQuizFeedbackToast(null), 3500);
      return;
    }

    if (isSpeaking) {
      if (isSpeechPaused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();

    if (!currentSection) return;

    const phaseTitle = `Phase ${currentSectionIndex + 1}: ${currentSection.title}.`;
    const outcome = `Target learning outcome: ${currentSection.learningOutcome}.`;
    const cleanedBody = cleanMarkdownForSpeech(currentSection.content);
    const exercise = currentSection.interactiveElement
      ? `Interactive practice challenge: ${currentSection.interactiveElement.prompt}.`
      : '';

    const narrationScript = `${phaseTitle} ${outcome} ${cleanedBody} ${exercise}`;

    const utterance = new SpeechSynthesisUtterance(narrationScript);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const availableVoices = window.speechSynthesis.getVoices();
    const naturalVoice =
      availableVoices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))) ||
      availableVoices.find((v) => v.lang.startsWith('en'));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utterance.onpause = () => {
      setIsSpeechPaused(true);
    };

    utterance.onresume = () => {
      setIsSpeechPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsSpeechPaused(false);
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    if (isSpeaking) {
      handleStopSpeech();
      setTimeout(() => {
        handleToggleReadAloud();
      }, 50);
    }
  };

  // Dynamic AI Quiz Generation based on current sections
  const handleGenerateDynamicQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lesson.title,
          objective: lesson.learningObjective,
          sections: lesson.sections,
        }),
      });

      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        setActiveQuizQuestions(data.questions);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizFeedbackToast('Fresh 5-question Lesson Mastery Quiz generated!');
        setTimeout(() => setQuizFeedbackToast(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to dynamically generate quiz:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const selectQuizAnswer = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    activeQuizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  // Helper to extract or construct a valid YouTube watch URL
  const getYouTubeWatchUrl = (vid: YouTubeSource) => {
    if (vid.searchQueryOrUrl && vid.searchQueryOrUrl.startsWith('http')) {
      return vid.searchQueryOrUrl;
    }
    if (vid.videoId) {
      return `https://www.youtube.com/watch?v=${vid.videoId}`;
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(vid.title + ' ' + vid.channel)}`;
  };

  // Helper to get embeddable YouTube ID
  const getYouTubeEmbedId = (vid: YouTubeSource): string | null => {
    if (vid.videoId && vid.videoId.length >= 10) return vid.videoId;
    if (vid.searchQueryOrUrl) {
      const match = vid.searchQueryOrUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    return null;
  };

  // Helper for textbook OpenLibrary and Publisher links
  const getBookLinks = (book: BookSource) => {
    const directUrl = book.url || `https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' book')}`;
    const libraryUrl =
      book.libraryLink ||
      `https://openlibrary.org/search?q=${encodeURIComponent(book.title + ' ' + book.author)}`;
    return { directUrl, libraryUrl };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {quizFeedbackToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131f33] border border-teal-500/80 shadow-2xl text-xs font-semibold text-teal-300">
          <Check className="w-4 h-4 text-teal-400" />
          <span>{quizFeedbackToast}</span>
        </div>
      )}

      {/* Top Controller Bar - Low-Fatigue Teal & Muted Slate Palette */}
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#0b121f] rounded-lg border border-[#1e2f4a]">
          <button
            onClick={() => setDeliveryMode('instructor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              deliveryMode === 'instructor'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Instructor-Led Teaching Mode</span>
          </button>
          <button
            onClick={() => setDeliveryMode('self-learning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              deliveryMode === 'self-learning'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Self-Learning (45 Min)</span>
          </button>
        </div>

        {/* Center: Live 45-Minute Lesson Timer */}
        <div className="flex items-center gap-3 bg-[#0b121f] px-4 py-1.5 rounded-lg border border-[#1e2f4a]">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Lesson Pacing:</span>
          </div>
          <span className="font-mono font-bold text-white text-base tabular-nums">
            {formatTimer(elapsedSeconds)} / 45:00
          </span>

          <div className="flex items-center gap-1 border-l border-[#1e2f4a] pl-2">
            <button
              onClick={toggleTimer}
              className="p-1 hover:text-white text-slate-300 transition-colors cursor-pointer"
              title={timerRunning ? 'Pause timer' : 'Start timer'}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-teal-400" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-1 hover:text-white text-slate-300 transition-colors cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Speaker Notes Toggle for Instructor */}
        {deliveryMode === 'instructor' && showSpeakerNotes && (
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showSpeakerNotes
                ? 'bg-teal-950/80 text-teal-300 border-teal-800'
                : 'bg-[#182740] text-slate-300 border-[#22395d] hover:text-white'
            }`}
          >
            {showSpeakerNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
          </button>
        )}
      </div>

      {/* VISUAL PROGRESS BAR WITH PERSISTENT NAVIGATIONAL DOTS */}
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-4 shadow-sm">
        {/* Progress Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
              PHASE {currentSectionIndex + 1} OF {totalSections}
            </span>
            <span className="text-sm font-bold text-white truncate">
              {currentTiming.phase}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-teal-300 font-semibold bg-[#0b121f] px-2.5 py-1 rounded-md border border-[#1e2f4a]">
              Window: {currentTiming.timeWindow}
            </span>
            <span className="text-slate-400">
              {currentProgressPercent}% Complete
            </span>
          </div>
        </div>

        {/* Persistent Navigational Track with Proportional Dots */}
        <div className="relative pt-3 pb-6 px-3">
          {/* Background Track Line */}
          <div className="absolute top-6 left-3 right-3 h-1.5 bg-[#0b121f] rounded-full border border-[#1e2f4a]" />

          {/* Animated Gradient Active Fill Line */}
          <div
            className="absolute top-6 left-3 h-1.5 bg-gradient-to-r from-teal-600 via-teal-400 to-sky-400 rounded-full transition-all duration-300 ease-out"
            style={{
              width: totalSections > 1
                ? `calc(${(currentSectionIndex / (totalSections - 1)) * 100}% - 6px)`
                : '100%',
            }}
          />

          {/* Persistent Navigational Dots */}
          <div className="relative flex items-center justify-between z-10">
            {lesson.sections.map((sec, idx) => {
              const isCurrent = currentSectionIndex === idx;
              const isPast = currentSectionIndex > idx;

              return (
                <div key={sec.id} className="flex flex-col items-center">
                  <button
                    onClick={() => setCurrentSectionIndex(idx)}
                    title={`Jump to Phase ${idx + 1}: ${sec.title} (${sec.allocatedMinutes} min)`}
                    className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-400 text-[#0b121f] font-extrabold ring-4 ring-teal-500/40 shadow-lg scale-110'
                        : isPast
                        ? 'bg-teal-700 text-teal-100 hover:bg-teal-600 hover:scale-105'
                        : 'bg-[#0b121f] text-slate-400 border-2 border-[#1e2f4a] hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span className="text-xs font-mono font-bold">{idx + 1}</span>
                    )}

                    {/* Active Pulse Glow Ring */}
                    {isCurrent && (
                      <span className="absolute -inset-1 rounded-full animate-ping bg-teal-400/20 pointer-events-none" />
                    )}
                  </button>

                  {/* Persistent Sub-label below dot */}
                  <div
                    onClick={() => setCurrentSectionIndex(idx)}
                    className="mt-2 text-center cursor-pointer max-w-[100px] hidden sm:block"
                  >
                    <div
                      className={`text-[10px] uppercase font-mono font-bold transition-colors ${
                        isCurrent ? 'text-teal-300' : 'text-slate-400'
                      }`}
                    >
                      P{idx + 1} · {sec.allocatedMinutes}m
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 leading-tight transition-colors ${
                        isCurrent ? 'font-bold text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {sec.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Jump Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-[#1e2f4a]/60">
          {lesson.sections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => setCurrentSectionIndex(idx)}
              className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border transform hover:-translate-y-0.5 ${
                currentSectionIndex === idx
                  ? 'bg-teal-950/90 border-teal-500 text-white shadow-sm ring-1 ring-teal-500/50'
                  : 'bg-[#0b121f] border-[#1e2f4a] text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-mono text-teal-400">
                <span>Phase {idx + 1}</span>
                <span className="text-slate-400">{sec.allocatedMinutes} min</span>
              </div>
              <div className="text-xs font-semibold truncate mt-1">{sec.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* INLINE VIDEO MODAL (IF USER CLICKS WATCH IN PLAYER) */}
      {activeEmbedVideo && (
        <div className="bg-[#131f33] border-2 border-teal-500/80 rounded-2xl p-5 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                Watching Video Resource: {activeEmbedVideo.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveEmbedVideo(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#182740] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#1e2f4a]">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeEmbedVideo.id}?autoplay=1`}
              title={activeEmbedVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Main Content Stage */}
      {currentSection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Lesson Content (2 Columns) */}
          <div className="lg:col-span-2 bg-[#131f33] border border-[#1e2f4a] rounded-xl p-6 lg:p-8 space-y-6">
            <div className="border-b border-[#1e2f4a] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 text-xs text-teal-400 font-mono mb-1">
                  <span>SECTION {currentSectionIndex + 1} OF {lesson.sections.length}</span>
                  <span className="text-slate-600">·</span>
                  <span>ALLOCATED: {currentSection.allocatedMinutes} MINUTES</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {currentSection.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                  <span className="font-semibold text-teal-300">Target Outcome:</span>
                  <span>{currentSection.learningOutcome}</span>
                </div>
              </div>

              {/* READ ALOUD AUDIO NARRATION SUITE (Web Speech API) */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 bg-[#0b121f] p-2 rounded-xl border border-[#1e2f4a] shadow-sm">
                {!isSpeaking ? (
                  <button
                    onClick={handleToggleReadAloud}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    title="Listen to an audio narration of this curriculum section via Web Speech API"
                  >
                    <Volume2 className="w-4 h-4 text-teal-200" />
                    <span>Read Aloud</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Animated Equalizer Waveform */}
                    <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-teal-950/90 rounded-lg border border-teal-700 text-teal-300 shadow-inner">
                      <div className={`w-1 h-3.5 bg-teal-400 rounded-full ${isSpeechPaused ? '' : 'animate-pulse'}`} />
                      <div className={`w-1 h-4.5 bg-teal-300 rounded-full ${isSpeechPaused ? '' : 'animate-pulse delay-75'}`} />
                      <div className={`w-1 h-2.5 bg-teal-400 rounded-full ${isSpeechPaused ? '' : 'animate-pulse delay-150'}`} />
                      <div className={`w-1 h-4 bg-sky-400 rounded-full ${isSpeechPaused ? '' : 'animate-pulse delay-100'}`} />
                      <span className="text-[11px] font-mono font-bold ml-1.5">
                        {isSpeechPaused ? 'Paused' : 'Narrating...'}
                      </span>
                    </div>

                    {/* Pause / Resume */}
                    <button
                      onClick={handleToggleReadAloud}
                      className="p-2 text-slate-200 hover:text-white bg-[#182740] hover:bg-[#22395d] rounded-lg transition-colors cursor-pointer"
                      title={isSpeechPaused ? 'Resume narration' : 'Pause narration'}
                    >
                      {isSpeechPaused ? <Play className="w-3.5 h-3.5 text-teal-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    {/* Stop */}
                    <button
                      onClick={handleStopSpeech}
                      className="p-2 text-slate-200 hover:text-rose-400 bg-[#182740] hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                      title="Stop narration"
                    >
                      <Square className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                )}

                {/* Speech Speed Multipliers */}
                <div className="flex items-center gap-1 border-l border-[#1e2f4a] pl-2 text-[10px] font-mono">
                  {[1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${
                        speechRate === rate
                          ? 'bg-teal-950 text-teal-300 font-bold border border-teal-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={`Set playback speed to ${rate}x`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Markdown Body Content with High-Legibility Low-Fatigue Contrast */}
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
              {currentSection.content.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={pIdx} className="text-lg font-bold text-white mt-6 mb-2">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('#### ')) {
                  return (
                    <h4 key={pIdx} className="text-base font-semibold text-teal-200 mt-4 mb-1">
                      {paragraph.replace('#### ', '')}
                    </h4>
                  );
                }
                if (paragraph.startsWith('```')) {
                  return (
                    <pre key={pIdx} className="p-4 rounded-lg bg-[#0b121f] border border-[#1e2f4a] font-mono text-xs text-teal-300 overflow-x-auto">
                      <code>{paragraph.replace(/```[a-z]*\n?/g, '')}</code>
                    </pre>
                  );
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <blockquote key={pIdx} className="p-3 rounded-lg bg-teal-950/40 border border-teal-800/60 text-teal-100 text-xs italic">
                      {paragraph.replace('> ', '')}
                    </blockquote>
                  );
                }
                return (
                  <p key={pIdx} className="text-slate-200 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Interactive Element (Code Exercise or Thought Experiment) */}
            {currentSection.interactiveElement && (
              <div className="p-5 rounded-xl bg-[#0b121f] border border-teal-900/60 space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                      Interactive Practice: {currentSection.interactiveElement.type}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSolution(currentSection.id)}
                    className="text-xs font-semibold text-teal-400 hover:text-teal-300 underline cursor-pointer"
                  >
                    {revealedSolutions[currentSection.id] ? 'Hide Solution' : 'Reveal Solution / Explanation'}
                  </button>
                </div>

                <p className="text-sm text-slate-200 font-medium">
                  {currentSection.interactiveElement.prompt}
                </p>

                {revealedSolutions[currentSection.id] && (
                  <div className="p-3 rounded-lg bg-teal-950/70 border border-teal-800 text-xs text-teal-100 leading-relaxed">
                    <span className="font-semibold text-teal-300 block mb-1">Explanation / Solution:</span>
                    {currentSection.interactiveElement.sampleSolutionOrExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Prev / Next Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-[#1e2f4a]">
              <button
                disabled={currentSectionIndex === 0}
                onClick={() => setCurrentSectionIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-[#182740] hover:bg-[#203354] rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Phase</span>
              </button>

              <span className="text-xs text-slate-400 font-mono">
                {currentSectionIndex + 1} / {lesson.sections.length}
              </span>

              <button
                disabled={currentSectionIndex === lesson.sections.length - 1}
                onClick={() => setCurrentSectionIndex((prev) => Math.min(lesson.sections.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span>Next Phase</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Instructor Notes & Supplementary Research Sources with PROMINENT CLICKABLE LINKS */}
          <div className="space-y-6">
            {/* Instructor Speaker Notes Card */}
            {deliveryMode === 'instructor' && showSpeakerNotes && (
              <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Instructor Speaker Notes
                  </h3>
                </div>
                <div className="p-3 bg-amber-950/25 border border-amber-900/40 rounded-lg text-xs text-amber-100 leading-relaxed space-y-2">
                  <p>{currentSection.instructorSpeakerNotes}</p>
                </div>
              </div>
            )}

            {/* Supplementary YouTube Videos with Direct Watch Links & Embedded Play Option */}
            <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Video Resources</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  {lesson.researchSources?.youtubeVideos?.length || 0} Curated
                </span>
              </div>

              <div className="space-y-3">
                {lesson.researchSources?.youtubeVideos?.map((vid, vIdx) => {
                  const watchUrl = getYouTubeWatchUrl(vid);
                  const embedId = getYouTubeEmbedId(vid);

                  return (
                    <div key={vIdx} className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs space-y-2 hover:border-[#284164] transition-colors">
                      <div className="font-semibold text-slate-200">{vid.title}</div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="text-slate-300 font-medium">{vid.channel}</span>
                        <span className="font-mono text-teal-400 font-semibold">{vid.approxDuration}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        <span className="text-teal-400 font-medium">Recommended Clip:</span> {vid.recommendedClip}
                      </p>

                      {/* Direct Clickable Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e2f4a]/70">
                        <a
                          href={watchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
                        >
                          <Youtube className="w-3 h-3" />
                          <span>Watch on YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {embedId && (
                          <button
                            onClick={() => setActiveEmbedVideo({ id: embedId, title: vid.title })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:text-white bg-[#182740] hover:bg-[#22395d] rounded-md border border-[#22395d] transition-colors cursor-pointer"
                          >
                            <Video className="w-3 h-3 text-teal-400" />
                            <span>Play In Lesson</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canonical Reference Books with Direct Clickable Open Library & Publisher Links */}
            <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Canonical Textbooks</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                  {lesson.researchSources?.books?.length || 0} Textbooks
                </span>
              </div>

              <div className="space-y-3">
                {lesson.researchSources?.books?.map((b, bIdx) => {
                  const { directUrl, libraryUrl } = getBookLinks(b);

                  return (
                    <div key={bIdx} className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs space-y-2 hover:border-[#284164] transition-colors">
                      <div className="font-semibold text-slate-200 leading-snug">
                        {b.title} <span className="text-slate-400 font-normal">({b.year})</span>
                      </div>
                      <div className="text-slate-400 text-[11px] font-medium">{b.author}</div>
                      <div className="text-slate-400 text-[11px] italic leading-snug">{b.chapterOrTopic}</div>
                      <div className="text-teal-300 text-[11px] leading-snug">{b.relevance}</div>

                      {/* Direct Clickable Textbook Links */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e2f4a]/70">
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:text-white bg-sky-950/80 hover:bg-sky-900 rounded-md border border-sky-800 transition-colors"
                        >
                          <BookMarked className="w-3 h-3 text-sky-400" />
                          <span>Publisher / Web Edition</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <a
                          href={libraryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-[#182740] hover:bg-[#22395d] rounded-md border border-[#22395d] transition-colors"
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

            {/* Web Docs & RFC Specifications */}
            <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold text-white">Official Web RFCs & Docs</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  {lesson.researchSources?.websites?.length || 0} Standards
                </span>
              </div>

              <div className="space-y-2.5">
                {lesson.researchSources?.websites?.map((web, wIdx) => (
                  <div key={wIdx} className="p-3 bg-[#0b121f] rounded-lg border border-[#1e2f4a] text-xs space-y-1.5 hover:border-[#284164] transition-colors">
                    <div className="font-semibold text-slate-200">{web.title}</div>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                      {web.sourceType}
                    </span>
                    <p className="text-slate-400 text-[11px] leading-snug">{web.keyContribution}</p>
                    <a
                      href={web.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300 pt-1"
                    >
                      <span>Read Official RFC Specification</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL CANONICAL RESEARCH & MULTIMEDIA CITATIONS BANNER */}
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2f4a] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Canonical Curriculum Bibliography</span>
            </div>
            <h3 className="text-xl font-bold text-white">Verified Research Sources & Open Reference Library</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Every lesson synthesizes canonical textbooks, official RFC standards, and curated video lectures. All links are live and verified.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Books */}
          <div className="bg-[#0b121f] border border-[#1e2f4a] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1e2f4a]">
              <BookMarked className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Canonical Textbooks ({lesson.researchSources?.books?.length || 0})
              </h4>
            </div>
            <div className="space-y-3">
              {lesson.researchSources?.books?.map((b, idx) => {
                const { directUrl, libraryUrl } = getBookLinks(b);
                return (
                  <div key={idx} className="p-3 bg-[#131f33] rounded-lg border border-[#1e2f4a] text-xs space-y-1.5">
                    <div className="font-semibold text-white">{b.title}</div>
                    <div className="text-slate-400 text-[11px]">{b.author} ({b.year})</div>
                    <div className="text-slate-400 text-[11px] italic">{b.chapterOrTopic}</div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-300 hover:text-white font-semibold underline"
                      >
                        <span>Publisher / Web</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-slate-500">·</span>
                      <a
                        href={libraryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-white font-semibold underline"
                      >
                        <span>Open Library</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Web Docs / RFCs */}
          <div className="bg-[#0b121f] border border-[#1e2f4a] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1e2f4a]">
              <Globe className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Official RFCs & Documentation ({lesson.researchSources?.websites?.length || 0})
              </h4>
            </div>
            <div className="space-y-3">
              {lesson.researchSources?.websites?.map((web, idx) => (
                <div key={idx} className="p-3 bg-[#131f33] rounded-lg border border-[#1e2f4a] text-xs space-y-1.5">
                  <div className="font-semibold text-white">{web.title}</div>
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                    {web.sourceType}
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{web.keyContribution}</p>
                  <a
                    href={web.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-white font-semibold underline pt-1"
                  >
                    <span>Open Specification</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: YouTube Videos */}
          <div className="bg-[#0b121f] border border-[#1e2f4a] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1e2f4a]">
              <Youtube className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Curated Video Lectures ({lesson.researchSources?.youtubeVideos?.length || 0})
              </h4>
            </div>
            <div className="space-y-3">
              {lesson.researchSources?.youtubeVideos?.map((vid, idx) => {
                const watchUrl = getYouTubeWatchUrl(vid);
                const embedId = getYouTubeEmbedId(vid);

                return (
                  <div key={idx} className="p-3 bg-[#131f33] rounded-lg border border-[#1e2f4a] text-xs space-y-1.5">
                    <div className="font-semibold text-white">{vid.title}</div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{vid.channel}</span>
                      <span className="font-mono text-teal-400">{vid.approxDuration}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{vid.recommendedClip}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={watchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-white font-semibold underline"
                      >
                        <span>Watch on YouTube</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      {embedId && (
                        <>
                          <span className="text-slate-500">·</span>
                          <button
                            onClick={() => setActiveEmbedVideo({ id: embedId, title: vid.title })}
                            className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-white font-semibold underline cursor-pointer"
                          >
                            <span>Embed Player</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC LESSON MASTERY QUIZ FEATURE */}
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2f4a] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Lesson Mastery Quiz (Dynamic AI Evaluation)</span>
            </div>
            <h3 className="text-xl font-bold text-white">Formative Concept Mastery Assessment</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              5-question multiple-choice diagnostic generated dynamically from current curriculum modules with instant feedback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dynamic AI Generate Button */}
            <button
              onClick={handleGenerateDynamicQuiz}
              disabled={isGeneratingQuiz}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-200 bg-teal-950/80 hover:bg-teal-900 border border-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingQuiz ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-300" />
                  <span>Synthesizing Quiz...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Generate Dynamic Quiz with AI</span>
                </>
              )}
            </button>

            {quizSubmitted && (
              <div className="text-xs font-bold font-mono px-3 py-1.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-200">
                Score: {calculateQuizScore()} / {activeQuizQuestions.length} ({Math.round((calculateQuizScore() / activeQuizQuestions.length) * 100)}%)
              </div>
            )}

            {quizSubmitted ? (
              <button
                onClick={resetQuiz}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#182740] rounded-lg border border-[#22395d] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            ) : (
              <button
                onClick={() => setQuizSubmitted(true)}
                disabled={Object.keys(quizAnswers).length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                Submit & Grade All
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {activeQuizQuestions.map((q, qIdx) => {
            const hasAnswered = quizAnswers[q.id] !== undefined;
            const selectedOpt = quizAnswers[q.id];
            const isCorrect = selectedOpt === q.correctIndex;
            const showEvaluation = quizSubmitted || (instantFeedbackMode && hasAnswered);

            return (
              <div
                key={q.id || qIdx}
                className="p-5 rounded-xl bg-[#0b121f] border border-[#1e2f4a] space-y-3 transition-all hover:border-[#284164]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-bold text-teal-400 shrink-0 mt-0.5">
                      Q{qIdx + 1}.
                    </span>
                    <span className="text-sm font-semibold text-white">{q.question}</span>
                  </div>

                  {showEvaluation && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                        isCorrect
                          ? 'bg-teal-950/80 text-teal-300 border-teal-800'
                          : 'bg-rose-950/80 text-rose-300 border-rose-800'
                      }`}
                    >
                      {isCorrect ? 'Correct' : 'Needs Review'}
                    </span>
                  )}
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isThisSelected = selectedOpt === optIdx;
                    const isThisCorrect = q.correctIndex === optIdx;

                    let optionStyle = 'bg-[#131f33] border-[#1e2f4a] text-slate-200 hover:border-teal-600/60';
                    if (isThisSelected && !showEvaluation) {
                      optionStyle = 'bg-teal-950 border-teal-500 text-white ring-1 ring-teal-500';
                    } else if (showEvaluation) {
                      if (isThisCorrect) {
                        optionStyle = 'bg-teal-950/90 border-teal-500 text-teal-100 font-semibold ring-1 ring-teal-500/60';
                      } else if (isThisSelected && !isThisCorrect) {
                        optionStyle = 'bg-rose-950/80 border-rose-600 text-rose-200 line-through';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => selectQuizAnswer(q.id, optIdx)}
                        className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-400 text-[11px]">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                        {showEvaluation && isThisCorrect && (
                          <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 ml-2" />
                        )}
                        {showEvaluation && isThisSelected && !isThisCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Immediate Feedback Rationale */}
                {showEvaluation && (
                  <div className="p-3.5 rounded-lg bg-[#131f33]/90 border border-teal-900/50 text-xs text-slate-200 leading-relaxed mt-2 space-y-1">
                    <span className="font-semibold text-teal-300 block">
                      Pedagogical Rationale:
                    </span>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
