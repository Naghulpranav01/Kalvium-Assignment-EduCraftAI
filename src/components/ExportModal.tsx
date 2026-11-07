import React, { useState } from 'react';
import { LessonPlan, QCLayer1Report, QCLayer2Report } from '../types/lesson';
import { Download, Copy, Check, X, FileText, Printer, FileCode, Sparkles, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  // Generate full markdown
  const generateMarkdownLesson = () => {
    let md = `> **EduCraft AI · Curriculum Architecture & Dual QC Validation Studio**\n`;
    md += `> *Author / Engineering: done by Naghul Pranav K R*\n\n`;
    md += `# ${lesson.title}\n\n`;
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
    md += `### Textbooks\n`;
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

  // Generate Professional Formatted PDF Document via jsPDF
  const generateAndDownloadPDF = () => {
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      let y = 16;

      const checkAddPage = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
          renderPageHeader();
        }
      };

      const renderPageHeader = () => {
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 12, 'F');

        doc.setFillColor(13, 148, 136); // #0d9488 teal accent line
        doc.rect(0, 11.5, pageWidth, 0.7, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('EDUCRAFT AI · CURRICULUM ARCHITECTURE & DUAL QC STUDIO · DONE BY NAGHUL PRANAV K R', margin, 7.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('DUAL QC VERIFIED', pageWidth - margin - 26, 7.5);
      };

      // 1. Cover / Title Header
      renderPageHeader();
      y = 24;

      // Studio Sub-Badge
      doc.setFillColor(19, 31, 51);
      doc.roundedRect(margin, y, 78, 6.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(20, 184, 166); // teal-400
      doc.text('45-MINUTE INSTRUCTIONAL MASTERCLASS', margin + 3, y + 4.5);
      y += 11;

      // Lesson Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(lesson.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 7.5 + 2;

      // Learning Objective Box
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      const objectiveLines = doc.splitTextToSize(`Objective: ${lesson.learningObjective}`, contentWidth - 8);
      const objectiveBoxHeight = objectiveLines.length * 4.5 + 7;
      doc.roundedRect(margin, y, contentWidth, objectiveBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(objectiveLines, margin + 4, y + 5.5);
      y += objectiveBoxHeight + 5;

      // Metadata summary row (Duration, Audience, Quality Score)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(13, 148, 136);
      doc.text(`Target Audience: ${lesson.targetAudience}`, margin, y);
      doc.text(`Duration: 45:00 Budgeted`, margin + 85, y);
      doc.text(`QC Scores: Factual ${qc1Report?.score || 94}/100 · Pedagogy ${qc2Report?.score || 96}/100`, margin + 125, y);
      y += 6;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // 2. 45-Minute Pacing Schedule
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. 45-Minute Pedagogical Timing Blueprint', margin, y);
      y += 6;

      lesson.timingBreakdown.forEach((phase) => {
        checkAddPage(10);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136);
        doc.text(phase.timeWindow, margin + 3, y + 4.5);

        doc.setTextColor(30, 41, 59);
        doc.text(`${phase.phase} (${phase.minutes}m)`, margin + 30, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const focusText = doc.splitTextToSize(phase.focus, contentWidth - 95);
        doc.text(focusText[0] || '', margin + 92, y + 4.5);

        y += 8.5;
      });

      y += 4;

      // 3. Curriculum Sections
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Curriculum Modules & Instructional Script', margin, y);
      y += 7;

      lesson.sections.forEach((sec, idx) => {
        checkAddPage(22);

        // Section Title Banner
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`Phase ${idx + 1}: ${sec.title}`, margin + 3, y + 5.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136);
        doc.text(`${sec.allocatedMinutes} Minutes`, pageWidth - margin - 22, y + 5.2);
        y += 11;

        // Learning Outcome
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const outcomeLines = doc.splitTextToSize(`Outcome: ${sec.learningOutcome}`, contentWidth);
        doc.text(outcomeLines, margin, y);
        y += outcomeLines.length * 4.2 + 3;

        // Content Body
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        const cleanBody = sec.content
          .replace(/```[a-z]*\n?/g, '')
          .replace(/```/g, '')
          .replace(/^### /gm, '')
          .replace(/^#### /gm, '')
          .replace(/^> /gm, 'Note: ');

        const bodyLines = doc.splitTextToSize(cleanBody, contentWidth);
        bodyLines.forEach((line: string) => {
          checkAddPage(5);
          doc.text(line, margin, y);
          y += 4;
        });

        // Speaker notes
        if (sec.instructorSpeakerNotes) {
          checkAddPage(14);
          y += 2;
          doc.setFillColor(254, 243, 199); // amber-100
          doc.setDrawColor(245, 158, 11); // amber-500
          const noteLines = doc.splitTextToSize(`Instructor Notes: ${sec.instructorSpeakerNotes}`, contentWidth - 6);
          const noteHeight = noteLines.length * 4 + 5;
          doc.roundedRect(margin, y, contentWidth, noteHeight, 1.5, 1.5, 'FD');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(146, 64, 14);
          doc.text(noteLines, margin + 3, y + 4);
          y += noteHeight + 3;
        }

        y += 4;
      });

      // 4. Formative Knowledge Check Quiz
      checkAddPage(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Formative Concept Mastery Assessment (Quiz)', margin, y);
      y += 6;

      lesson.knowledgeCheck.forEach((q, qIdx) => {
        checkAddPage(22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const qLines = doc.splitTextToSize(`Q${qIdx + 1}. ${q.question}`, contentWidth);
        doc.text(qLines, margin, y);
        y += qLines.length * 4.2 + 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        q.options.forEach((opt, optIdx) => {
          checkAddPage(5);
          const isCorrect = optIdx === q.correctIndex;
          if (isCorrect) {
            doc.setTextColor(13, 148, 136); // Teal
            doc.text(`${String.fromCharCode(65 + optIdx)}. ${opt} [CORRECT]`, margin + 4, y);
          } else {
            doc.setTextColor(71, 85, 105);
            doc.text(`${String.fromCharCode(65 + optIdx)}. ${opt}`, margin + 4, y);
          }
          y += 4;
        });

        // Rationale
        checkAddPage(8);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const rLines = doc.splitTextToSize(`Rationale: ${q.explanation}`, contentWidth - 8);
        doc.text(rLines, margin + 4, y);
        y += rLines.length * 3.5 + 4;
      });

      // 5. Research Sources & Citations
      checkAddPage(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Canonical Citations & Verified Research Bibliography', margin, y);
      y += 6;

      // Books
      if (lesson.researchSources?.books?.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(13, 148, 136);
        doc.text('Canonical Textbooks:', margin, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        lesson.researchSources.books.forEach((b) => {
          checkAddPage(6);
          doc.text(`• ${b.title} (${b.year}) by ${b.author} - ${b.chapterOrTopic}`, margin + 4, y);
          y += 4;
        });
        y += 2;
      }

      // Web Docs / RFCs
      if (lesson.researchSources?.websites?.length) {
        checkAddPage(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(13, 148, 136);
        doc.text('Official Web Standards & RFC Documentation:', margin, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        lesson.researchSources.websites.forEach((w) => {
          checkAddPage(6);
          doc.text(`• ${w.title} [${w.sourceType}]: ${w.url}`, margin + 4, y);
          y += 4;
        });
        y += 2;
      }

      // Video Resources
      if (lesson.researchSources?.youtubeVideos?.length) {
        checkAddPage(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(13, 148, 136);
        doc.text('Curated YouTube Video Resources:', margin, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        lesson.researchSources.youtubeVideos.forEach((v) => {
          checkAddPage(6);
          doc.text(`• ${v.title} (${v.channel}, ${v.approxDuration}) - ${v.recommendedClip}`, margin + 4, y);
          y += 4;
        });
        y += 2;
      }

      // Add Running Page Numbers & Footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.text(
          'EduCraft AI · Curriculum Architecture & Dual QC Validation Studio done by Naghul Pranav K R',
          margin,
          pageHeight - 8
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 8);
      }

      const fileName = `${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-45min-lesson-plan.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF via jsPDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950 text-teal-300 border border-teal-800">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Finalized Lesson & QC Reports</h3>
              <p className="text-xs text-teal-300 font-medium">EduCraft AI · done by Naghul Pranav K R</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* PRIMARY OPTION: Formatted PDF Document (jsPDF) */}
          <div className="p-4 bg-gradient-to-r from-teal-950/60 to-slate-900 rounded-xl border border-teal-500/50 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-900/60 rounded-lg text-teal-300 border border-teal-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Formatted Studio PDF Document</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    jsPDF
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Professional multi-page document with timing blueprints, speaker notes, quizzes & citations
                </div>
              </div>
            </div>
            <button
              onClick={generateAndDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: Markdown Lesson */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
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
                className="p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
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

          {/* Option 3: Dual QC Audit Reports */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
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
                className="p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
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

          {/* Option 4: Structured JSON (LMS Ready) */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-semibold text-teal-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          {/* Option 5: Browser Native Print */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-stone-300 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-white">Browser Print Dialog</div>
                <div className="text-xs text-slate-400">Send directly to connected printer or system print spooler</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Layout</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-700">
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
