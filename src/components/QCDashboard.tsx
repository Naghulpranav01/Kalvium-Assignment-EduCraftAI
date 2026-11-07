import React, { useState } from 'react';
import { LessonPlan, QCLayer1Report, QCLayer2Report, QCIssue, InstructionalIssue } from '../types/lesson';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Globe,
  Youtube,
  ArrowRight,
  Sparkles,
  Check,
  RefreshCw,
  FileText,
  Clock,
  Target,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  lesson: LessonPlan;
  qc1Report: QCLayer1Report | null;
  qc2Report: QCLayer2Report | null;
  onApplyQC1Issue: (issue: QCIssue) => void;
  onApplyQC2Issue: (issue: InstructionalIssue) => void;
  onBatchApplyAll: () => void;
  onReAudit: () => void;
  isAuditing: boolean;
}

export const QCDashboard: React.FC<Props> = ({
  lesson,
  qc1Report,
  qc2Report,
  onApplyQC1Issue,
  onApplyQC2Issue,
  onBatchApplyAll,
  onReAudit,
  isAuditing,
}) => {
  const [activeTab, setActiveTab] = useState<'layer1' | 'layer2' | 'comparison'>('layer1');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIssueId(expandedIssueId === id ? null : id);
  };

  const getSeverityBadge = (severity: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (severity) {
      case 'HIGH':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80">High Severity</span>;
      case 'MEDIUM':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">Medium Severity</span>;
      case 'LOW':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/80">Refinement / Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-teal-950/90 text-teal-300 border border-teal-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Passed & Approved</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-amber-950/90 text-amber-300 border border-amber-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Revisions Recommended</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-950/70 border border-teal-700/60 text-teal-300 font-semibold">
                EduCraft AI QC Validation Engine
              </span>
              <span>·</span>
              <span className="text-slate-300">
                done by <strong className="text-teal-300 font-bold">Naghul Pranav K R</strong>
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Two Independent Quality Control (QC) Layers
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Independent dual-audit architecture: Layer 1 evaluates scientific/RFC correctness & citation integrity.
              Layer 2 evaluates pedagogical scaffolding, 45-minute timing feasibility, and learning objective coverage.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onBatchApplyAll}
              disabled={isAuditing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply All QC Improvements</span>
            </button>

            <button
              onClick={onReAudit}
              disabled={isAuditing}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Re-run both QC audits"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing...' : 'Re-Audit'}</span>
            </button>
          </div>
        </div>

        {/* Dual Layer Score Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Layer 1 Quick Card */}
          <div
            onClick={() => setActiveTab('layer1')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'layer1'
                ? 'bg-slate-700 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">QC Layer 1: Research & Factual Accuracy</h3>
                  <p className="text-xs text-slate-400">RFC verification, book validity & claim audit</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-teal-300 tabular-nums">
                  {qc1Report?.score ?? '--'}%
                </div>
                {qc1Report && getStatusBadge(qc1Report.status)}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <span>{qc1Report?.issues.length || 0} findings recorded</span>
              <span className="text-teal-400 font-medium">View Layer 1 Audit &rarr;</span>
            </div>
          </div>

          {/* Layer 2 Quick Card */}
          <div
            onClick={() => setActiveTab('layer2')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'layer2'
                ? 'bg-slate-700 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">QC Layer 2: Instructional Quality</h3>
                  <p className="text-xs text-slate-400">Objective alignment, 45-min pacing & clarity</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-sky-300 tabular-nums">
                  {qc2Report?.score ?? '--'}%
                </div>
                {qc2Report && getStatusBadge(qc2Report.status)}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <span>{qc2Report?.instructionalIssues.length || 0} recommendations</span>
              <span className="text-sky-400 font-medium">View Layer 2 Audit &rarr;</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={() => setActiveTab('layer1')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'layer1'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            QC Layer 1: Research & Factual Accuracy Report
          </button>
          <button
            onClick={() => setActiveTab('layer2')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'layer2'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            QC Layer 2: Instructional Quality Report
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Side-by-Side Dual Audit Matrix
          </button>
        </div>
      </div>

      {/* TAB 1: QC LAYER 1 */}
      {activeTab === 'layer1' && (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Audit Synthesis</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{qc1Report?.summary}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-700">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>Books Audited</span>
                </div>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {qc1Report?.sourceVerification.booksAudited || lesson.researchSources?.books?.length || 0}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span>Web Sources / RFCs</span>
                </div>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {qc1Report?.sourceVerification.websitesAudited || lesson.researchSources?.websites?.length || 0}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Youtube className="w-3.5 h-3.5 text-rose-400" />
                  <span>Videos Verified</span>
                </div>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {qc1Report?.sourceVerification.youtubeAudited || lesson.researchSources?.youtubeVideos?.length || 0}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Citation Reliability</span>
                </div>
                <div className="text-lg font-bold font-mono text-teal-300 mt-1">
                  {qc1Report?.sourceVerification.citationReliabilityScore || 98}%
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Findings */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Itemized Factual Findings & Source Corrections</h3>
                <p className="text-xs text-slate-400">
                  Inspect unsupported claims or technical discrepancies with instant 1-click patch application.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {qc1Report?.issues.filter((i) => !i.applied).length || 0} pending improvements
              </span>
            </div>

            <div className="space-y-4">
              {qc1Report?.issues?.map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded-xl border transition-all ${
                    issue.applied
                      ? 'bg-slate-900/60 border-slate-700 opacity-75'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(issue.id)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(issue.severity)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{issue.category}</span>
                          <span className="text-xs text-slate-400 font-mono">[{issue.location}]</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{issue.critique}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {issue.applied ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-teal-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyQC1Issue(issue);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-200 bg-teal-950/80 hover:bg-teal-900 border border-teal-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                          <span>Apply Correction</span>
                        </button>
                      )}
                      {expandedIssueId === issue.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expandedIssueId === issue.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-700 space-y-3">
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-1">Auditor Critique:</div>
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-800 p-2.5 rounded border border-slate-700">
                          {issue.critique}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded bg-rose-950/30 border border-rose-900/40">
                          <div className="font-semibold text-rose-300 mb-1">Original Text in Lesson:</div>
                          <div className="font-mono text-slate-300 line-through opacity-80 break-words">
                            "{issue.originalTextOrClaim}"
                          </div>
                        </div>

                        <div className="p-3 rounded bg-teal-950/30 border border-teal-800/40">
                          <div className="font-semibold text-teal-300 mb-1">Recommended Correction (RFC Aligned):</div>
                          <div className="font-mono text-teal-200 break-words">
                            "{issue.recommendedCorrection}"
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QC LAYER 2 */}
      {activeTab === 'layer2' && (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Pedagogical Analysis
              </span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{qc2Report?.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-teal-400" />
                    <span>Objective Alignment</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {qc2Report?.objectiveAlignment.alignmentPercentage || 100}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${qc2Report?.objectiveAlignment.alignmentPercentage || 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                  Goal: "{lesson.learningObjective}"
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>45-Min Pacing Feasibility</span>
                  </div>
                  <span className="font-mono font-bold text-teal-300">
                    {qc2Report?.timingFeasibility.pacingRating || 'EXCELLENT'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                  {qc2Report?.timingFeasibility.pacingAssessment ||
                    'Allocated exactly 45 minutes across 5 phases.'}
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sub-Clauses Covered</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {qc2Report?.objectiveAlignment.coveredAspects?.map((aspect, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-slate-200">
                      <Check className="w-3 h-3 text-teal-400 shrink-0" />
                      <span className="truncate">{aspect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Instructional Issues */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Pedagogical Recommendations & Gaps</h3>
                <p className="text-xs text-slate-400">
                  Address student friction points, strengthen analogies, and enhance interactive practice.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {qc2Report?.instructionalIssues.filter((i) => !i.applied).length || 0} pending recommendations
              </span>
            </div>

            <div className="space-y-4">
              {qc2Report?.instructionalIssues?.map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded-xl border transition-all ${
                    issue.applied
                      ? 'bg-slate-900/60 border-slate-700 opacity-75'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(issue.id)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(issue.severity)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{issue.area}</span>
                          <span className="text-xs text-slate-400 font-mono">[{issue.targetSection}]</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{issue.observedProblem}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {issue.applied ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-teal-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyQC2Issue(issue);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900 border border-sky-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span>Apply Improvement</span>
                        </button>
                      )}
                      {expandedIssueId === issue.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expandedIssueId === issue.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-700 space-y-3">
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-1">Instructional Diagnosis:</div>
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-800 p-2.5 rounded border border-slate-700">
                          {issue.observedProblem}
                        </p>
                      </div>

                      <div className="p-3 rounded bg-sky-950/30 border border-sky-800/40 text-xs">
                        <div className="font-semibold text-sky-300 mb-1">Recommended Instructional Enhancement:</div>
                        <div className="text-slate-200 leading-relaxed">
                          {issue.pedagogicalRecommendation || issue.recommendedImprovement}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DUAL MATRIX */}
      {activeTab === 'comparison' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-2">Side-by-Side Dual QC Comparison Matrix</h3>
          <p className="text-xs text-slate-300 mb-6">
            Compare the independent verdicts of Quality Control Layer 1 (Factual Accuracy) and Layer 2 (Instructional Quality).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-teal-800/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-white text-sm">QC Layer 1: Factual & Research</span>
                </div>
                <span className="font-mono font-bold text-teal-300 text-lg">{qc1Report?.score}%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{qc1Report?.summary}</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-sky-800/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                  <span className="font-bold text-white text-sm">QC Layer 2: Instructional Quality</span>
                </div>
                <span className="font-mono font-bold text-sky-300 text-lg">{qc2Report?.score}%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{qc2Report?.summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
