import React, { useState } from 'react';
import { LessonPlan, QCLayer1Report, QCLayer2Report } from '../types/lesson';
import { Download, Copy, Check, X, FileText, Printer, FileCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonPlan;
  qc1Report: QCLayer1Report | null;
  qc2Report: QCLayer2Report | null;
}

export const ExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lesson,
  qc1Report,
  qc2Report,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate full markdown
  const generateMarkdownLesson = () => {
    let md = `# ${lesson.title}\n\n`;
    md += `**Target Audience:** ${lesson.targetAudience}\n`;
    md += `**Estimated Duration:** 45 Minutes\n`;
    md += `**Learning Objective:** ${lesson.learningObjective}\n\n`;
    md += `## Curriculum Overview\n${lesson.overview}\n\n`;

    md += `## 45-Minute Timing Breakdown\n`;
    lesson.timingBreakdown.forEach((t) => {
      md += `- **${t.timeWindow}** (${t.minutes}m): ${t.phase} - ${t.focus}\n`;
    });
    md += `\n---\n\n`;

    lesson.sections.forEach((sec, idx) => {
      md += `## Section ${idx + 1}: ${sec.title} (${sec.allocatedMinutes} Minutes)\n`;
      md += `**Learning Outcome:** ${sec.learningOutcome}\n\n`;
      md += `${sec.content}\n\n`;

      if (sec.instructorSpeakerNotes) {
        md += `> **Instructor Speaker Notes:** ${sec.instructorSpeakerNotes}\n\n`;
      }

      if (sec.interactiveElement) {
        md += `### Interactive Practice (${sec.interactiveElement.type})\n`;
        md += `**Prompt:** ${sec.interactiveElement.prompt}\n\n`;
        md += `**Sample Solution:** ${sec.interactiveElement.sampleSolutionOrExplanation}\n\n`;
      }
      md += `---\n\n`;
    });

    md += `## Formative Knowledge Check (Final 7 Minutes)\n\n`;
    lesson.knowledgeCheck.forEach((q, qIdx) => {
      md += `### Question ${qIdx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        md += `${String.fromCharCode(65 + oIdx)}. ${opt}${oIdx === q.correctIndex ? ' *(Correct)*' : ''}\n`;
      });
      md += `\n**Pedagogical Rationale:** ${q.explanation}\n\n`;
    });

    md += `## Canonical Research Citations\n\n`;
    md += `### Books\n`;
    lesson.researchSources?.books?.forEach((b) => {
      md += `- *${b.title}* (${b.year}) by ${b.author}. ${b.chapterOrTopic}.\n`;
    });

    md += `\n### Official Web Documentation & RFCs\n`;
    lesson.researchSources?.websites?.forEach((w) => {
      md += `- [${w.title}](${w.url}) (${w.sourceType}) - ${w.keyContribution}\n`;
    });

    md += `\n### Supplementary Video Resources\n`;
    lesson.researchSources?.youtubeVideos?.forEach((v) => {
      md += `- [${v.title}](${v.searchQueryOrUrl}) by ${v.channel} (${v.approxDuration})\n`;
    });

    return md;
  };

  // Generate dual QC markdown report
  const generateQCReportMarkdown = () => {
    let md = `# Dual-Layer Quality Control (QC) Audit Report\n\n`;
    md += `**Lesson Title:** ${lesson.title}\n`;
    md += `**Learning Objective:** ${lesson.learningObjective}\n`;
    md += `**Audit Date:** ${new Date().toLocaleDateString()}\n\n`;

    md += `## QC Layer 1: Research and Factual Accuracy\n`;
    md += `- **Score:** ${qc1Report?.score || '--'} / 100\n`;
    md += `- **Status:** ${qc1Report?.status || 'PENDING'}\n`;
    md += `- **Summary:** ${qc1Report?.summary || ''}\n\n`;
    md += `### Itemized Factual Accuracy Findings:\n`;
    qc1Report?.issues?.forEach((issue, idx) => {
      md += `${idx + 1}. **[${issue.severity}] ${issue.category}** (${issue.location})\n`;
      md += `   - Original: "${issue.originalTextOrClaim}"\n`;
      md += `   - Auditor Critique: ${issue.critique}\n`;
      md += `   - Recommended Correction: "${issue.recommendedCorrection}"\n`;
      md += `   - Applied Status: ${issue.applied ? 'APPLIED' : 'PENDING'}\n\n`;
    });

    md += `\n---\n\n`;
    md += `## QC Layer 2: Instructional Quality\n`;
    md += `- **Score:** ${qc2Report?.score || '--'} / 100\n`;
    md += `- **Status:** ${qc2Report?.status || 'PENDING'}\n`;
    md += `- **Summary:** ${qc2Report?.summary || ''}\n`;
    md += `- **Objective Alignment:** ${qc2Report?.objectiveAlignment?.alignmentPercentage || 100}%\n`;
    md += `- **45-Min Pacing Rating:** ${qc2Report?.timingFeasibility?.pacingRating || 'EXCELLENT'}\n\n`;
    md += `### Instructional Findings & Recommendations:\n`;
    qc2Report?.instructionalIssues?.forEach((issue, idx) => {
      md += `${idx + 1}. **[${issue.severity}] ${issue.area}** (${issue.targetSection})\n`;
      md += `   - Observed Problem: ${issue.observedProblem}\n`;
      md += `   - Recommendation: ${issue.pedagogicalRecommendation || issue.recommendedImprovement}\n`;
      md += `   - Applied Status: ${issue.applied ? 'APPLIED' : 'PENDING'}\n\n`;
    });

    return md;
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#131f33] border border-[#1e2f4a] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2f4a]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950 text-teal-300 border border-teal-800">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Finalized Lesson & QC Reports</h3>
              <p className="text-xs text-slate-400">Download formatted Markdown, JSON, or print-ready PDF view</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Option 1: Markdown Lesson */}
          <div className="p-4 bg-[#0b121f] rounded-xl border border-[#1e2f4a] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white">45-Minute Lesson Plan (.md)</div>
                <div className="text-xs text-slate-400">Complete curriculum with timings, markdown, and references</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(generateMarkdownLesson(), 'md-lesson')}
                className="p-2 bg-[#182740] hover:bg-[#203354] border border-[#22395d] rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Markdown"
              >
                {copiedType === 'md-lesson' ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    `${lesson.title.toLowerCase().replace(/\s+/g, '-')}-lesson-plan.md`,
                    generateMarkdownLesson(),
                    'text/markdown'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          {/* Option 2: Dual QC Audit Reports */}
          <div className="p-4 bg-[#0b121f] rounded-xl border border-[#1e2f4a] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white">Dual QC Audit Reports (.md)</div>
                <div className="text-xs text-slate-400">Layer 1 Factual + Layer 2 Instructional quality audit verdicts</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(generateQCReportMarkdown(), 'qc-report')}
                className="p-2 bg-[#182740] hover:bg-[#203354] border border-[#22395d] rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy QC Report"
              >
                {copiedType === 'qc-report' ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    `${lesson.title.toLowerCase().replace(/\s+/g, '-')}-qc-audit-reports.md`,
                    generateQCReportMarkdown(),
                    'text/markdown'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          {/* Option 3: Structured JSON (LMS Ready) */}
          <div className="p-4 bg-[#0b121f] rounded-xl border border-[#1e2f4a] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-teal-300 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white">Structured JSON Bundle (.json)</div>
                <div className="text-xs text-slate-400">Full lesson, quiz array, sources, and QC audit payloads</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  downloadFile(
                    `${lesson.title.toLowerCase().replace(/\s+/g, '-')}-bundle.json`,
                    JSON.stringify({ lesson, qc1Report, qc2Report }, null, 2),
                    'application/json'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182740] hover:bg-[#203354] border border-[#22395d] rounded-lg text-xs font-semibold text-teal-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          {/* Option 4: Browser Print / Save as PDF */}
          <div className="p-4 bg-[#0b121f] rounded-xl border border-[#1e2f4a] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-stone-300 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white">Print / Save as PDF</div>
                <div className="text-xs text-slate-400">Open clean print layout to save directly as PDF</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182740] hover:bg-[#203354] border border-[#22395d] rounded-lg text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#1e2f4a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
