import React, { useState } from 'react';
import { LessonPlan, LessonSection } from '../types/lesson';
import {
  Save,
  Plus,
  Trash2,
  Clock,
  Check,
  Edit3,
} from 'lucide-react';

interface Props {
  lesson: LessonPlan;
  onSaveLesson: (updated: LessonPlan) => void;
}

export const LessonEditor: React.FC<Props> = ({ lesson, onSaveLesson }) => {
  const [editedLesson, setEditedLesson] = useState<LessonPlan>(JSON.parse(JSON.stringify(lesson)));
  const [activeSectionId, setActiveSectionId] = useState<string>(lesson.sections[0]?.id || '');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  const totalMinutes = editedLesson.sections.reduce((acc, sec) => acc + (Number(sec.allocatedMinutes) || 0), 0);

  const activeSection = editedLesson.sections.find((s) => s.id === activeSectionId) || editedLesson.sections[0];

  const updateActiveSection = (field: keyof LessonSection, value: any) => {
    setEditedLesson((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === activeSection.id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleSave = () => {
    onSaveLesson(editedLesson);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const addNewSection = () => {
    const newId = `sec-${Date.now()}`;
    const newSec: LessonSection = {
      id: newId,
      title: 'New Lesson Module',
      allocatedMinutes: 5,
      learningOutcome: 'Understand key technical implications.',
      content: '### New Section\n\nAdd technical explanation, examples, and code here.',
      instructorSpeakerNotes: 'Guide students through this concept and pause for questions.',
      interactiveElement: {
        type: 'thought-experiment',
        prompt: 'Consider how this affects scalability.',
        sampleSolutionOrExplanation: 'Analyze latency and throughput tradeoffs.',
      },
    };
    setEditedLesson((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
    }));
    setActiveSectionId(newId);
  };

  const deleteSection = (id: string) => {
    if (editedLesson.sections.length <= 1) return;
    const remaining = editedLesson.sections.filter((s) => s.id !== id);
    setEditedLesson((prev) => ({
      ...prev,
      sections: remaining,
    }));
    setActiveSectionId(remaining[0].id);
  };

  return (
    <div className="space-y-6">
      {/* Editor Header Bar */}
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Instructor Curriculum Authoring Workspace</span>
          </div>
          <h2 className="text-xl font-bold text-white">Review & Edit Lesson Content</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* 45-Minute Total Time Budget Counter */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
              totalMinutes === 45
                ? 'bg-teal-950/80 border-teal-700 text-teal-300'
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Total Duration: {totalMinutes} / 45 min</span>
            {totalMinutes !== 45 && (
              <span className="text-[11px] font-normal">
                ({totalMinutes < 45 ? `${45 - totalMinutes}m remaining` : `${totalMinutes - 45}m over`})
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {isSavedToast ? <Check className="w-4 h-4 text-teal-200" /> : <Save className="w-4 h-4" />}
            <span>{isSavedToast ? 'Changes Saved!' : 'Save Lesson Edits'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Section Nav (Left) + Editor Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Section Navigator */}
        <div className="bg-[#131f33] border border-[#1e2f4a] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Curriculum Sections
            </span>
            <button
              onClick={addNewSection}
              className="p-1 hover:text-white text-teal-400 transition-colors cursor-pointer"
              title="Add Section"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {editedLesson.sections.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between ${
                  activeSection.id === sec.id
                    ? 'bg-teal-950/80 border-teal-500 text-white shadow-sm'
                    : 'bg-[#0b121f] border-[#1e2f4a] text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-[10px] uppercase font-mono text-teal-400">
                    Phase {idx + 1} · {sec.allocatedMinutes}m
                  </div>
                  <div className="text-xs font-semibold truncate mt-0.5">{sec.title}</div>
                </div>

                {editedLesson.sections.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection(sec.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addNewSection}
            className="w-full mt-2 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-[#182740] hover:bg-[#203354] border border-[#22395d] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>Add Module Phase</span>
          </button>
        </div>

        {/* Right: Active Section Form */}
        <div className="lg:col-span-3 bg-[#131f33] border border-[#1e2f4a] rounded-xl p-6 space-y-5">
          {/* Section Title & Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Module Title</label>
              <input
                type="text"
                value={activeSection.title}
                onChange={(e) => updateActiveSection('title', e.target.value)}
                className="w-full px-3 py-2 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Allocated Minutes</label>
              <input
                type="number"
                min="1"
                max="45"
                value={activeSection.allocatedMinutes}
                onChange={(e) => updateActiveSection('allocatedMinutes', parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-sm text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Learning Outcome */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Target Learning Outcome</label>
            <input
              type="text"
              value={activeSection.learningOutcome}
              onChange={(e) => updateActiveSection('learningOutcome', e.target.value)}
              className="w-full px-3 py-2 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Edit vs Preview Toggle */}
          <div className="flex items-center justify-between pt-2">
            <label className="text-xs font-semibold text-slate-300">Lesson Markdown Content</label>
            <div className="flex items-center gap-1 p-0.5 bg-[#0b121f] rounded border border-[#1e2f4a]">
              <button
                onClick={() => setPreviewTab('edit')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  previewTab === 'edit' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Markdown Editor
              </button>
              <button
                onClick={() => setPreviewTab('preview')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  previewTab === 'preview' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rendered Preview
              </button>
            </div>
          </div>

          {previewTab === 'edit' ? (
            <textarea
              rows={12}
              value={activeSection.content}
              onChange={(e) => updateActiveSection('content', e.target.value)}
              className="w-full px-4 py-3 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed resize-y"
            />
          ) : (
            <div className="p-4 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-xs text-slate-200 space-y-3 max-h-[300px] overflow-y-auto leading-relaxed">
              {activeSection.content.split('\n\n').map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          )}

          {/* Instructor Speaker Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <span>Instructor Speaker Notes & Timing Cues</span>
            </label>
            <textarea
              rows={3}
              value={activeSection.instructorSpeakerNotes}
              onChange={(e) => updateActiveSection('instructorSpeakerNotes', e.target.value)}
              className="w-full px-3 py-2 bg-[#0b121f] border border-[#1e2f4a] rounded-lg text-xs text-amber-200 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
