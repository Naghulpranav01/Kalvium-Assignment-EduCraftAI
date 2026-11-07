import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI with user-provided key or environment key
const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Igwl46XWy75_eBCuyaV_MaO5mw-JpEFbXgMiuE0NPeQ';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Flag indicating if gemini-4-argon has quota on the current API key
// Flag indicating if gemini-4-argon has quota on the current API key
let hasArgonQuota = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Robust execution with exponential retry for transient 503/high-demand spikes
async function executeWithRetry(model: string, contents: any, config?: any, maxAttempts = 3): Promise<string | undefined> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return res.text;
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      const is503 = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');
      if (is503 && attempt < maxAttempts) {
        await sleep(1200 * attempt);
        continue;
      }
      throw err;
    }
  }
}

// Helper for resilient model calling with seamless fallback
async function generateWithFallback(preferredModel: string, contents: any, config?: any) {
  const modelToUse = (preferredModel === 'gemini-4-argon' && !hasArgonQuota)
    ? 'gemini-3.8-flash'
    : preferredModel;

  const activeConfig = { ...config };
  if (modelToUse === 'gemini-3.8-flash' && activeConfig.thinkingConfig?.thinkingLevel) {
    activeConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  try {
    return await executeWithRetry(modelToUse, contents, activeConfig);
  } catch (err: any) {
    // If argon hit 429 quota, fallback to gemini-3.8-flash
    if (modelToUse === 'gemini-4-argon') {
      hasArgonQuota = false;
      const fallbackConfig = { ...config };
      if (fallbackConfig.thinkingConfig?.thinkingLevel) {
        fallbackConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }
      return await executeWithRetry('gemini-3.8-flash', contents, fallbackConfig);
    }

    // If gemini-3.8-flash is experiencing temporary 503 load, fallback to gemini-3.1-flash-lite
    try {
      const liteConfig = { ...config };
      delete liteConfig.thinkingConfig;
      return await executeWithRetry('gemini-3.1-flash-lite', contents, liteConfig);
    } catch {
      throw err;
    }
  }
}

// 1. Generate Lesson with Research Sources (Books, Websites, YouTube)
app.post('/api/lesson/generate', async (req, res) => {
  try {
    const { title, objective, audience = 'College / Junior Software Engineer', format = 'mixed', enableThinking = true } = req.body;

    if (!title || !objective) {
      return res.status(400).json({ error: 'Lesson Title and Learning Objective are required.' });
    }

    const model = enableThinking ? 'gemini-4-argon' : 'gemini-3.8-flash';
    const config: any = {
      systemInstruction: `You are an elite Lead Instructional Designer & Senior Computer Science Curriculum Architect.
Your mission is to synthesize a master-class, comprehensive 45-minute lesson based strictly on the provided Title and Learning Objective.
The lesson must be strictly designed to be completed within 45 minutes, whether for self-learning or instructor-led teaching.
You must research canonical books, authoritative web sources (RFCs, official docs, MDN, academic papers), and curated YouTube videos.
Output valid JSON ONLY matching the requested structure. No markdown formatting around the JSON if possible, or markdown code blocks that can be parsed as JSON.`,
      responseMimeType: 'application/json',
    };

    if (enableThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const prompt = `Synthesize an authoritative 45-minute lesson plan for:
Title: "${title}"
Learning Objective: "${objective}"
Target Audience: "${audience}"
Delivery Format: "${format}"

Generate a complete JSON object with this exact shape:
{
  "title": string,
  "learningObjective": string,
  "targetAudience": string,
  "estimatedDurationMinutes": 45,
  "overview": string (concise 2-3 sentence overview),
  "timingBreakdown": [
    {
      "phase": string (e.g. "Hook & Real-World Motivation", "Core Mental Models & Architecture", "Code Walkthrough & Edge Cases", "Interactive Hands-on Challenge", "Knowledge Check & Synthesis"),
      "timeWindow": string (e.g. "00:00 - 05:00", "05:00 - 18:00", "18:00 - 28:00", "28:00 - 38:00", "38:00 - 45:00"),
      "minutes": number,
      "focus": string
    }
  ],
  "sections": [
    {
      "id": string (e.g. "sec-1"),
      "title": string,
      "allocatedMinutes": number,
      "learningOutcome": string,
      "content": string (detailed, rich Markdown with clear headings, conceptual breakdown, concrete code/diagram syntax, and step-by-step logic),
      "instructorSpeakerNotes": string (tips for teaching, common student pitfalls, pauses for questions),
      "interactiveElement": {
        "type": "code-exercise" | "thought-experiment" | "troubleshooting" | "discussion",
        "prompt": string,
        "sampleSolutionOrExplanation": string
      }
    }
  ],
  "knowledgeCheck": [
    {
      "id": string,
      "question": string,
      "options": string[],
      "correctIndex": number,
      "explanation": string
    }
  ],
  "researchSources": {
    "books": [
      {
        "title": string,
        "author": string,
        "year": string,
        "chapterOrTopic": string,
        "relevance": string,
        "url": string (direct URL to book, e.g. https://www.oreilly.com/ or https://hpbn.co/ or google books),
        "libraryLink": string (direct OpenLibrary link, e.g. https://openlibrary.org/search?q=...)
      }
    ],
    "websites": [
      {
        "title": string,
        "url": string (canonical working URL, e.g. https://datatracker.ietf.org/doc/html/rfc9110 or https://developer.mozilla.org/en-US/docs/Web/HTTP),
        "sourceType": "Official Documentation" | "RFC Specification" | "Academic / MDN Guide",
        "keyContribution": string
      }
    ],
    "youtubeVideos": [
      {
        "title": string,
        "channel": string,
        "approxDuration": string,
        "recommendedClip": string (e.g. "Watch minutes 02:15 to 07:40 for packet lifecycle animation"),
        "searchQueryOrUrl": string (direct https://www.youtube.com/watch?v=... URL),
        "embedQuery": string,
        "videoId": string (11-character YouTube video ID if standard, e.g. "iYM2zFP3Zn0")
      }
    ]
  },
  "referencesSummary": string (formal citations and links formatted for the lesson footer)
}`;

    const text = await generateWithFallback(model, prompt, config);
    let parsed;
    try {
      parsed = JSON.parse(text || '{}');
    } catch (e) {
      const match = text?.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse model response into JSON');
      }
    }

    res.json({ success: true, lesson: parsed, modelUsed: model });
  } catch (error: any) {
    console.error('Error in /api/lesson/generate:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate lesson content.' });
  }
});

// 2. QC Layer 1: Research and Factual Accuracy
app.post('/api/qc/layer1', async (req, res) => {
  try {
    const { lesson, enableThinking = true } = req.body;
    if (!lesson) {
      return res.status(400).json({ error: 'Lesson data required for QC Layer 1 audit.' });
    }

    const model = enableThinking ? 'gemini-4-argon' : 'gemini-3.8-flash';
    const config: any = {
      systemInstruction: `You are the Lead Scientific Fact-Checker and Technical Accuracy Auditor for the Academic Quality Council.
Your role is to rigorously scrutinize educational lesson plans for:
1. Factual correctness, precision of definitions, and identifying misleading or oversimplified claims.
2. Checking reliability, relevance, and authenticity of books, RFCs, and external references.
3. Identifying gaps, contradictions, or technical inconsistencies.
Output valid JSON only.`,
      responseMimeType: 'application/json',
    };

    if (enableThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const prompt = `Conduct a thorough QC Layer 1 (Research & Factual Accuracy) audit on this lesson:

Title: ${lesson.title}
Objective: ${lesson.learningObjective}
Sections: ${JSON.stringify(lesson.sections?.map((s: any) => ({ title: s.title, content: s.content })) || [])}
Research Sources: ${JSON.stringify(lesson.researchSources || {})}

Return a JSON audit report with this exact structure:
{
  "qcLayer": "QC Layer 1: Research and Factual Accuracy",
  "score": number (0 to 100),
  "status": "APPROVED" | "REVISIONS_NEEDED" | "CRITICAL_FIXES_REQUIRED",
  "summary": string (2-3 sentences evaluating the factual rigor and source validity),
  "sourceVerification": {
    "booksAudited": number,
    "websitesAudited": number,
    "youtubeAudited": number,
    "citationReliabilityScore": number (0 to 100),
    "notes": string
  },
  "issues": [
    {
      "id": string (e.g. "qc1-item-1"),
      "category": "Factual Accuracy" | "Misleading Claim" | "Source Validity" | "Technical Inconsistency" | "Missing Crucial Concept",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "location": string (section name or subsection),
      "originalTextOrClaim": string,
      "critique": string,
      "recommendedCorrection": string,
      "autoFixPayload": {
        "sectionId": string,
        "findText": string,
        "replacementText": string
      }
    }
  ],
  "keyStrengths": string[],
  "suggestedRefinements": string[]
}`;

    const text = await generateWithFallback(model, prompt, config);
    let parsed;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      const match = text?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({ success: true, report: parsed, modelUsed: model });
  } catch (error: any) {
    console.error('Error in /api/qc/layer1:', error);
    res.status(500).json({ error: error?.message || 'QC Layer 1 audit failed.' });
  }
});

// 3. QC Layer 2: Instructional Quality & Objective Alignment
app.post('/api/qc/layer2', async (req, res) => {
  try {
    const { lesson, enableThinking = true } = req.body;
    if (!lesson) {
      return res.status(400).json({ error: 'Lesson data required for QC Layer 2 audit.' });
    }

    const model = enableThinking ? 'gemini-4-argon' : 'gemini-3.8-flash';
    const config: any = {
      systemInstruction: `You are the Director of Instructional Design & Pedagogy.
Your mission is to audit educational lessons for:
1. Strict alignment with the stated Learning Objective (ensure no sub-clause is left unaddressed).
2. Cognitive clarity, pedagogical scaffolding, student engagement, and structured progression.
3. 45-minute timing feasibility, ensuring explanations, activities, and knowledge checks fit the time window without cognitive overload.
4. Identifying gaps in real-world worked examples, code illustrations, or practical applications.
Output valid JSON only.`,
      responseMimeType: 'application/json',
    };

    if (enableThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const prompt = `Conduct a rigorous QC Layer 2 (Instructional Quality & Pedagogical Alignment) audit on this lesson:

Title: ${lesson.title}
Objective: ${lesson.learningObjective}
Timing Breakdown: ${JSON.stringify(lesson.timingBreakdown || [])}
Sections: ${JSON.stringify(lesson.sections || [])}
Knowledge Check: ${JSON.stringify(lesson.knowledgeCheck || [])}

Return a JSON audit report with this exact structure:
{
  "qcLayer": "QC Layer 2: Instructional Quality",
  "score": number (0 to 100),
  "status": "APPROVED" | "REVISIONS_NEEDED" | "NEEDS_RESTRUCTURING",
  "summary": string (concise pedagogical synthesis of how well this prepares students in 45 minutes),
  "objectiveAlignment": {
    "statedObjective": string,
    "alignmentPercentage": number (0 to 100),
    "coveredAspects": string[],
    "unaddressedOrWeakAspects": string[]
  },
  "timingFeasibility": {
    "totalAllocatedMinutes": number,
    "pacingRating": "EXCELLENT" | "TIGHT" | "OVERLOADED" | "TOO_BRIEF",
    "pacingAssessment": string
  },
  "instructionalIssues": [
    {
      "id": string (e.g. "qc2-item-1"),
      "area": "Objective Alignment" | "Cognitive Load" | "Explanation Gap" | "Missing Example" | "Activity Interactivity",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "targetSection": string,
      "observedProblem": string,
      "pedagogicalRecommendation": string,
      "recommendedImprovement": string,
      "autoFixPayload": {
        "sectionId": string,
        "additionalContentOrAdjustment": string
      }
    }
  ],
  "pedagogicalPraise": string[],
  "actionableTakeaways": string[]
}`;

    const text = await generateWithFallback(model, prompt, config);
    let parsed;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      const match = text?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({ success: true, report: parsed, modelUsed: model });
  } catch (error: any) {
    console.error('Error in /api/qc/layer2:', error);
    res.status(500).json({ error: error?.message || 'QC Layer 2 audit failed.' });
  }
});

// 4. Synthesize QC Fixes into Lesson
app.post('/api/lesson/apply-fixes', async (req, res) => {
  try {
    const { currentLesson, selectedRecommendations } = req.body;
    if (!currentLesson || !selectedRecommendations || !selectedRecommendations.length) {
      return res.status(400).json({ error: 'Current lesson and recommendations are required.' });
    }

    const config: any = {
      systemInstruction: 'You are an expert instructional editor. Update the lesson structure strictly incorporating the selected QC improvements while preserving the 45-minute target duration and markdown formatting.',
      responseMimeType: 'application/json',
    };

    const prompt = `Update the following lesson by applying ONLY these specific approved QC recommendations:
Selected Recommendations:
${JSON.stringify(selectedRecommendations, null, 2)}

Original Lesson:
${JSON.stringify(currentLesson, null, 2)}

Return the updated complete lesson JSON with the exact same structure as the original lesson, but with improved explanations, corrected facts, enriched examples, or adjusted timings according to the recommendations.`;

    const text = await generateWithFallback('gemini-3.8-flash', prompt, config);
    let parsed;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      const match = text?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : currentLesson;
    }

    res.json({ success: true, updatedLesson: parsed });
  } catch (error: any) {
    console.error('Error applying fixes:', error);
    res.status(500).json({ error: error?.message || 'Failed to apply QC improvements.' });
  }
});

// 5. Transcribe Audio (model: gemini-3.5-transcribe)
app.post('/api/audio/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Base64 audio data is required.' });
    }

    // gemini-3.5-transcribe as required by user prompt, with gemini-3.8-flash fallback
    let transcript = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe this spoken educational audio accurately into plain text. Also extract: 1) Suggested Lesson Title, 2) Primary Learning Objective.',
          },
        ],
      });
      transcript = response.text || '';
    } catch {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe this spoken educational audio accurately into plain text. Also extract: 1) Suggested Lesson Title, 2) Primary Learning Objective.',
          },
        ],
      });
      transcript = fallback.text || '';
    }

    res.json({
      success: true,
      transcript,
    });
  } catch (error: any) {
    console.error('Error in /api/audio/transcribe:', error);
    res.status(500).json({ error: error?.message || 'Audio transcription failed.' });
  }
});

// 6. Video Content Analysis (model: gemini-4-argon)
app.post('/api/video/analyze', async (req, res) => {
  try {
    const { videoUrl, videoBase64, videoMimeType = 'video/mp4', topicContext = '' } = req.body;

    if (!videoUrl && !videoBase64) {
      return res.status(400).json({ error: 'Either a video URL or videoBase64 is required.' });
    }

    const config: any = {
      systemInstruction: 'You are an educational video analyst for university-level technical courses. You extract key teaching segments, timestamps, conceptual definitions, and assess their relevance to a 45-minute lesson.',
      responseMimeType: 'application/json',
    };

    let parts: any[] = [];
    if (videoBase64) {
      parts.push({
        inlineData: {
          mimeType: videoMimeType,
          data: videoBase64,
        },
      });
      parts.push({
        text: `Analyze this educational video in the context of: "${topicContext}".
Return JSON:
{
  "videoSummary": string,
  "keyConceptsCovered": string[],
  "timestampSegments": [
    { "timestamp": string, "concept": string, "duration": string, "pedagogicalValue": string }
  ],
  "suitabilityFor45MinLesson": string,
  "suggestedIntegrationMinutes": string (e.g. "05:00 - 08:30"),
  "recommendedCheckQuestions": string[]
}`,
      });
    } else {
      // If URL is provided (e.g. YouTube), extract and evaluate pedagogical breakdown
      parts.push({
        text: `Analyze this educational video resource URL: "${videoUrl}" for the lesson context: "${topicContext}".
Generate a structured pedagogical analysis as JSON:
{
  "videoSummary": string,
  "keyConceptsCovered": string[],
  "timestampSegments": [
    { "timestamp": string, "concept": string, "duration": string, "pedagogicalValue": string }
  ],
  "suitabilityFor45MinLesson": string,
  "suggestedIntegrationMinutes": string,
  "recommendedCheckQuestions": string[]
}`,
      });
    }

    const text = await generateWithFallback('gemini-4-argon', parts, config);
    let parsed;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      const match = text?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Error in /api/video/analyze:', error);
    res.status(500).json({ error: error?.message || 'Video analysis failed.' });
  }
});

// 7. Dynamic Lesson Mastery Quiz Generator
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { title, objective, sections } = req.body;
    if (!sections || !sections.length) {
      return res.status(400).json({ error: 'Lesson sections are required to generate a mastery quiz.' });
    }

    const config: any = {
      systemInstruction: 'You are an expert psychometrician and instructional assessment designer. Generate a high-yield, 5-question multiple choice formative quiz testing the concepts taught in the provided lesson modules. Each question must test comprehension, application, or edge-case diagnostics rather than rote memory.',
      responseMimeType: 'application/json',
    };

    const prompt = `Generate a dynamic 5-question multiple-choice Lesson Mastery Quiz based on these curriculum sections:
Topic: "${title || 'Lesson Topic'}"
Objective: "${objective || 'Comprehensive Understanding'}"

Sections Content:
${JSON.stringify(sections.map((s: any) => ({ title: s.title, outcome: s.learningOutcome, content: s.content?.slice(0, 600) })))}

Return JSON ONLY:
{
  "questions": [
    {
      "id": string (e.g. "dyn-q1"),
      "question": string,
      "options": string[] (exactly 4 options),
      "correctIndex": number (0 to 3),
      "explanation": string (pedagogical rationale explaining why the correct option is right and the others are incorrect)
    }
  ]
}`;

    const text = await generateWithFallback('gemini-3.8-flash', prompt, config);
    let parsed: any;
    try {
      parsed = JSON.parse(text || '{}');
    } catch {
      const match = text?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { questions: [] };
    }

    const questions = parsed.questions || parsed.quiz || [];
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error generating mastery quiz:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate dynamic mastery quiz.' });
  }
});

// Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduCraft Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
