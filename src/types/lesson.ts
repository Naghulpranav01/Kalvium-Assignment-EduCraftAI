export interface TimingPhase {
  phase: string;
  timeWindow: string;
  minutes: number;
  focus: string;
}

export interface InteractiveElement {
  type: 'code-exercise' | 'thought-experiment' | 'troubleshooting' | 'discussion';
  prompt: string;
  sampleSolutionOrExplanation: string;
}

export interface LessonSection {
  id: string;
  title: string;
  allocatedMinutes: number;
  learningOutcome: string;
  content: string;
  instructorSpeakerNotes: string;
  interactiveElement?: InteractiveElement;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BookSource {
  title: string;
  author: string;
  year: string;
  chapterOrTopic: string;
  relevance: string;
  url?: string;
  libraryLink?: string;
}

export interface WebSource {
  title: string;
  url: string;
  sourceType: 'Official Documentation' | 'RFC Specification' | 'Academic / MDN Guide' | string;
  keyContribution: string;
}

export interface YouTubeSource {
  title: string;
  channel: string;
  approxDuration: string;
  recommendedClip: string;
  searchQueryOrUrl: string;
  embedQuery?: string;
  videoId?: string;
}

export interface ResearchSources {
  books: BookSource[];
  websites: WebSource[];
  youtubeVideos: YouTubeSource[];
}

export interface LessonPlan {
  title: string;
  learningObjective: string;
  targetAudience: string;
  estimatedDurationMinutes: number;
  overview: string;
  timingBreakdown: TimingPhase[];
  sections: LessonSection[];
  knowledgeCheck: QuizQuestion[];
  researchSources: ResearchSources;
  referencesSummary: string;
}

export interface QCIssue {
  id: string;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  originalTextOrClaim: string;
  critique: string;
  recommendedCorrection: string;
  autoFixPayload?: {
    sectionId?: string;
    findText?: string;
    replacementText?: string;
  };
  applied?: boolean;
}

export interface QCLayer1Report {
  qcLayer: string;
  score: number;
  status: 'APPROVED' | 'REVISIONS_NEEDED' | 'CRITICAL_FIXES_REQUIRED';
  summary: string;
  sourceVerification: {
    booksAudited: number;
    websitesAudited: number;
    youtubeAudited: number;
    citationReliabilityScore: number;
    notes: string;
  };
  issues: QCIssue[];
  keyStrengths: string[];
  suggestedRefinements: string[];
}

export interface InstructionalIssue {
  id: string;
  area: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  targetSection: string;
  observedProblem: string;
  pedagogicalRecommendation: string;
  recommendedImprovement: string;
  autoFixPayload?: {
    sectionId?: string;
    additionalContentOrAdjustment?: string;
  };
  applied?: boolean;
}

export interface QCLayer2Report {
  qcLayer: string;
  score: number;
  status: 'APPROVED' | 'REVISIONS_NEEDED' | 'NEEDS_RESTRUCTURING';
  summary: string;
  objectiveAlignment: {
    statedObjective: string;
    alignmentPercentage: number;
    coveredAspects: string[];
    unaddressedOrWeakAspects: string[];
  };
  timingFeasibility: {
    totalAllocatedMinutes: number;
    pacingRating: 'EXCELLENT' | 'TIGHT' | 'OVERLOADED' | 'TOO_BRIEF' | string;
    pacingAssessment: string;
  };
  instructionalIssues: InstructionalIssue[];
  pedagogicalPraise: string[];
  actionableTakeaways: string[];
}

export interface VideoAnalysisResult {
  videoSummary: string;
  keyConceptsCovered: string[];
  timestampSegments: Array<{
    timestamp: string;
    concept: string;
    duration: string;
    pedagogicalValue: string;
  }>;
  suitabilityFor45MinLesson: string;
  suggestedIntegrationMinutes: string;
  recommendedCheckQuestions: string[];
}
