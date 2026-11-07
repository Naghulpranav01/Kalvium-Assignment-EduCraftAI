import { LessonPlan, QCLayer1Report, QCLayer2Report } from '../types/lesson';

export interface SamplePreset {
  id: string;
  name: string;
  title: string;
  objective: string;
  audience: string;
  lesson: LessonPlan;
  qc1Report: QCLayer1Report;
  qc2Report: QCLayer2Report;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'http-requests',
    name: 'HTTP Requests & Responses (Assignment Benchmark)',
    title: 'HTTP Requests and Responses',
    objective: 'Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.',
    audience: 'Undergraduate Computer Science & Junior Full-Stack Developers',
    lesson: {
      title: 'HTTP Requests and Responses',
      learningObjective: 'Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.',
      targetAudience: 'Undergraduate Computer Science & Junior Full-Stack Developers',
      estimatedDurationMinutes: 45,
      overview: 'An authoritative 45-minute technical masterclass breaking down the core stateless protocol of the World Wide Web. Students explore the structural anatomy of HTTP requests/responses, contrast idempotent safe GET with payload-bearing POST, and systematically map HTTP status codes across the 2xx, 4xx, and 5xx spectrum with real-world debugging scenarios.',
      timingBreakdown: [
        {
          phase: 'Phase 1: Hook & The Stateless Highway',
          timeWindow: '00:00 - 05:00',
          minutes: 5,
          focus: 'Demystifying what happens when a browser requests a URL: TCP handshake, plain-text framing, and client-server dialogue.'
        },
        {
          phase: 'Phase 2: Methods Under the Hood (GET vs. POST)',
          timeWindow: '05:00 - 18:00',
          minutes: 13,
          focus: 'Idempotency, safety, query strings vs request bodies, caching implications, and security hygiene.'
        },
        {
          phase: 'Phase 3: The Response Taxonomy (2xx, 4xx, 5xx)',
          timeWindow: '18:00 - 28:00',
          minutes: 10,
          focus: 'Dissecting 200/201/204 Success, 400/401/403/404 Client Errors, and 500/502/503/504 Server Failures with diagnostic flowcharts.'
        },
        {
          phase: 'Phase 4: Hands-on Network Terminal Workshop',
          timeWindow: '28:00 - 38:00',
          minutes: 10,
          focus: 'Live debugging of curl requests, reading raw headers, identifying silent security bugs with POST vs GET leaks.'
        },
        {
          phase: 'Phase 5: Knowledge Check & Canonical Citations',
          timeWindow: '38:00 - 45:00',
          minutes: 7,
          focus: 'Timed interactive quiz, RFC reference review, and synthesis of production best practices.'
        }
      ],
      sections: [
        {
          id: 'sec-1',
          title: 'The Anatomy of HTTP: How the Web Communicates',
          allocatedMinutes: 5,
          learningOutcome: 'Understand the client-server request-response paradigm over TCP and the plain-text structure of HTTP/1.1.',
          content: `### 1. The Client-Server Architecture
The Hypertext Transfer Protocol (HTTP) is an application-layer, stateless protocol powering web communication. At its foundation:

1. **The Client (User Agent)** initiates a TCP connection (typically on port 80 for HTTP or 443 for TLS/HTTPS).
2. **The Request**: The client sends a formatted ASCII/binary message specifying a method, request-target (URI), protocol version, headers, and an optional body.
3. **The Server Process**: The web server processes headers, executes business logic, queries databases, and compiles an HTTP response.
4. **The Response**: Returned with a 3-digit status code, reason phrase, response headers (Content-Type, Cache-Control), and payload.

\`\`\`http
GET /api/v1/courses/cs101 HTTP/1.1
Host: api.educraft.dev
Accept: application/json
User-Agent: Mozilla/5.0
\`\`\`

> **Core Principle**: HTTP is **stateless**. Each request is executed independently without inherent awareness of prior transactions, which is why session tokens, cookies, and JWTs were invented.`,
          instructorSpeakerNotes: 'Hook the room with Chrome DevTools Network Tab: Open DevTools live on GitHub or any production web app, press Cmd+R, and show the cascade. Point out the Request URL, Method, and Status.',
          interactiveElement: {
            type: 'thought-experiment',
            prompt: 'If HTTP is completely stateless, why does your browser stay logged into your email or GitHub across page refreshes?',
            sampleSolutionOrExplanation: 'State is maintained artificially via cookies or Authorization Bearer headers sent with every single outbound request. The server verifies the cryptographic token on each cycle.'
          }
        },
        {
          id: 'sec-2',
          title: 'Deep Dive: GET vs. POST – Safety, Idempotency & Mechanics',
          allocatedMinutes: 13,
          learningOutcome: 'Contrast GET and POST across RFC specifications, idempotency, caching, and payload transmission rules.',
          content: `### 2. Method Semantics: RFC 9110 Directives

The HTTP specification (RFC 9110, superseding RFC 7231 and RFC 2616) formalizes exact architectural guarantees for request verbs.

| Attribute | GET Method | POST Method |
| :--- | :--- | :--- |
| **Primary Intent** | Retrieve data representation without side effects | Process enclosed payload / create resource |
| **Safe?** | **YES** (Must never mutate server state) | **NO** (Intended to trigger mutation) |
| **Idempotent?** | **YES** ($f(f(x)) = f(x)$ repeated calls yield same state) | **NO** (Multiple calls create duplicate resources) |
| **Data Placement** | URL Query String (\`?id=42&sort=asc\`) | Request Body (\`Content-Type: application/json\`) |
| **Browser Caching** | Yes (heuristic or Cache-Control compliant) | Never cached by default |
| **Browser History** | Remains in browser address bar history | Never stored in address bar |
| **Payload Size** | Restricted by URI length (~2048 chars max) | Practically unlimited (configured on server) |

#### Real-World Anti-Pattern: Mutating State in GET
A frequent junior developer mistake is placing actions in GET endpoints:
\`\`\`http
<!-- DANGEROUS ANTI-PATTERN -->
GET /users/delete?userId=1092 HTTP/1.1
\`\`\`
**Why this causes catastrophic bugs**:
1. Web crawlers and link prefetchers (Googlebot, Slack link previews) will trigger mass data deletion just by scraping your links!
2. Browsers may speculatively pre-render or retry GET requests on spotty networks, executing the mutation repeatedly.

#### The Correct POST Architecture
\`\`\`http
POST /api/v1/orders HTTP/1.1
Host: api.educraft.dev
Content-Type: application/json
Content-Length: 74

{
  "itemSku": "EDU-CS-PRO",
  "quantity": 1,
  "discountCode": "SEMESTER1"
}
\`\`\``,
          instructorSpeakerNotes: 'Emphasize the mathematical definition of Idempotency: Repeating the operation N times produces the exact same server state as executing it once. Show why PUT and DELETE are idempotent, whereas POST is not.',
          interactiveElement: {
            type: 'troubleshooting',
            prompt: 'A junior engineer sends a password reset token in the GET query string: /reset-password?token=secret123. Identify two major security vulnerabilities.',
            sampleSolutionOrExplanation: '1) Tokens in URLs are logged in plaintext in server access logs and intermediate proxies. 2) The token leaks via the Referer header to external third-party assets embedded on the page.'
          }
        },
        {
          id: 'sec-3',
          title: 'The Response Status Taxonomy: 2xx, 4xx, and 5xx Classes',
          allocatedMinutes: 10,
          learningOutcome: 'Distinguish between success (2xx), client-side error (4xx), and server-side failure (5xx) status codes with high diagnostic precision.',
          content: `### 3. Dissecting the 3-Digit Status Codes

HTTP response status codes are classified into 5 canonical buckets:
- **1xx (Informational)**: Request received, continuing process (e.g., 101 Switching Protocols).
- **2xx (Success)**: The action was successfully received, understood, and accepted.
- **3xx (Redirection)**: Further action must be taken by user agent (e.g., 301 Moved Permanently, 304 Not Modified).
- **4xx (Client Error)**: The fault lies with the caller (malformed syntax, invalid credentials, missing resource).
- **5xx (Server Error)**: The client sent a valid request, but the server failed to fulfill it.

#### 1. The 2xx Class: Successful Executions
- \`200 OK\`: Standard response for successful HTTP requests (GET data returns payload; PUT updates resource).
- \`201 Created\`: Resource successfully created (standard response for POST creation). Must include \`Location\` header.
- \`204 No Content\`: Action succeeded, but response intentionally has zero body payload (standard for successful DELETE).

#### 2. The 4xx Class: Client Errors (Fix Your Request!)
- \`400 Bad Request\`: Syntactically invalid payload (e.g. malformed JSON, schema validation failure).
- \`401 Unauthorized\`: **Authentication** missing or invalid (Identity unknown). Requires \`WWW-Authenticate\` header.
- \`403 Forbidden\`: **Authorization** failure. The server knows who you are, but you lack permission to this resource.
- \`404 Not Found\`: The target URI does not match any current resource.
- \`422 Unprocessable Entity\`: Semantically invalid request (valid JSON syntax, but email field lacks '@').

#### 3. The 5xx Class: Server Errors (Alert Engineering on Call!)
- \`500 Internal Server Error\`: Unhandled runtime exception in application code (null pointer, unhandled promise rejection).
- \`502 Bad Gateway\`: Reverse proxy (Nginx, Cloudflare) received an invalid response from upstream origin server.
- \`503 Service Unavailable\`: Server is overloaded or under maintenance (often includes \`Retry-After\` header).
- \`504 Gateway Timeout\`: Upstream microservice or database query took too long and the gateway severed the connection.

\`\`\`
Client Error (4xx)           Server Error (5xx)
  User sent bad data            App crashed or DB timed out
  Action: Fix payload           Action: Check server logs & Sentry
\`\`\``,
          instructorSpeakerNotes: 'Use the 401 vs 403 bouncer analogy: 401 means "Show your ID at the door; I don\'t know who you are." 403 means "I verified your ID, but you are not allowed in the VIP lounge."',
          interactiveElement: {
            type: 'code-exercise',
            prompt: 'What status code should an API return when an authenticated user attempts to edit a blog post owned by another author?',
            sampleSolutionOrExplanation: '403 Forbidden. The user is successfully authenticated (identity confirmed), but forbidden from mutating resources they do not own.'
          }
        },
        {
          id: 'sec-4',
          title: 'Hands-on Network Diagnostic Lab',
          allocatedMinutes: 10,
          learningOutcome: 'Apply curl and HTTP diagnostics to craft raw requests and analyze response headers in real time.',
          content: `### 4. Interactive Command-Line Network Lab

Let us inspect the live exchange using \`curl\` with verbose flags (\`-v\`):

\`\`\`bash
# 1. Inspecting GET with verbose headers
curl -v -X GET "https://jsonplaceholder.typicode.com/posts/1"

# Output reveals request headers (>) and response headers (<):
> GET /posts/1 HTTP/1.1
> Host: jsonplaceholder.typicode.com
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: application/json; charset=utf-8
< Cache-Control: max-age=43200
\`\`\`

\`\`\`bash
# 2. Inspecting POST with JSON Body
curl -v -X POST "https://jsonplaceholder.typicode.com/posts" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Computer Science Web API", "body": "HTTP Deep Dive", "userId": 1}'

# Output returns 201 Created:
< HTTP/1.1 201 Created
< Location: /posts/101
\`\`\`

#### Production Diagnostic Checklist:
1. Did the client supply the correct \`Content-Type\` header?
2. Is the response \`2xx\` or \`4xx\`? If \`4xx\`, log the validation payload.
3. If \`502/504\`, check your connection pool and upstream database latency.`,
          instructorSpeakerNotes: 'Have students run these curl commands in their terminal or DevTools console. Demonstrate that leaving out the Content-Type header on POST often yields a 415 Unsupported Media Type or 400 Bad Request.',
          interactiveElement: {
            type: 'discussion',
            prompt: 'Why does an API return 204 No Content for a successful DELETE operation instead of 200 OK with {"deleted": true}?',
            sampleSolutionOrExplanation: '204 avoids unnecessary byte transmission and serialization overhead. The client already knows what resource was deleted; transmitting an empty body saves bandwidth at scale.'
          }
        },
        {
          id: 'sec-5',
          title: 'Synthesis, Knowledge Check & Next Horizons',
          allocatedMinutes: 7,
          learningOutcome: 'Synthesize all 45 minutes of content, complete formative knowledge check, and bookmark canonical RFC specifications.',
          content: `### 5. Final Synthesis

In this 45-minute lesson, we established:
1. **HTTP Foundations**: Stateless, client-server, request-response architecture.
2. **GET vs. POST**: Safe/Idempotent data retrieval vs. mutating state via request bodies.
3. **Status Code Matrix**:
   - \`2xx\` = Success (\`200 OK\`, \`201 Created\`, \`204 No Content\`)
   - \`4xx\` = Client Error (\`400 Bad Request\`, \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`)
   - \`5xx\` = Server Error (\`500 Internal Server Error\`, \`502 Bad Gateway\`, \`503 Unavailable\`, \`504 Timeout\`)

Continue to the interactive quiz below to cement your mastery!`,
          instructorSpeakerNotes: 'Conduct the 5-question quiz live. Cold-call students to explain the reasoning behind their answers.',
          interactiveElement: {
            type: 'thought-experiment',
            prompt: 'In modern HTTP/2 and HTTP/3 (QUIC), how does the protocol improve over HTTP/1.1 while preserving these same GET/POST/status semantics?',
            sampleSolutionOrExplanation: 'HTTP/2 and HTTP/3 maintain the exact same application-layer semantics (methods, headers, status codes) while replacing plain-text TCP streams with binary framing, multiplexed streams, and UDP-based QUIC transport to eliminate head-of-line blocking.'
          }
        }
      ],
      knowledgeCheck: [
        {
          id: 'q1',
          question: 'Which statement accurately describes the RFC guarantee for HTTP GET requests?',
          options: [
            'GET requests must always be encrypted with AES-256.',
            'GET requests must be safe and idempotent, meaning they do not mutate server state.',
            'GET requests must carry a JSON body with Content-Length > 0.',
            'GET requests cannot be cached by intermediate proxies.'
          ],
          correctIndex: 1,
          explanation: 'Per RFC 9110, GET is defined as both safe (read-only, no server-side side effects) and idempotent (repeated identical calls leave the server in the identical state).'
        },
        {
          id: 'q2',
          question: 'A client submits an API request without an Authorization header to a protected route. What status code should be returned?',
          options: [
            '403 Forbidden',
            '401 Unauthorized',
            '404 Not Found',
            '500 Internal Server Error'
          ],
          correctIndex: 1,
          explanation: '401 Unauthorized is specifically reserved for missing or invalid authentication credentials (user identity unknown).'
        },
        {
          id: 'q3',
          question: 'What is the key functional difference between 401 Unauthorized and 403 Forbidden?',
          options: [
            '401 is a server error, while 403 is a database error.',
            '401 represents failed authentication (who you are), while 403 represents failed authorization (what you are permitted to do).',
            '401 is only used on mobile apps; 403 is used on desktop.',
            'There is no difference; they are aliases in RFC 9110.'
          ],
          correctIndex: 1,
          explanation: '401 = Authentication failure (Identity unverified). 403 = Authorization failure (Identity verified, but privileges insufficient).'
        },
        {
          id: 'q4',
          question: 'An Nginx reverse proxy cannot establish a connection to an upstream Node.js Express server because the Node.js process crashed. What status does Nginx send to the browser?',
          options: [
            '502 Bad Gateway',
            '404 Not Found',
            '204 No Content',
            '400 Bad Request'
          ],
          correctIndex: 0,
          explanation: '502 Bad Gateway indicates that an edge proxy or gateway received an invalid or null response from the upstream application server.'
        },
        {
          id: 'q5',
          question: 'Which status code is most appropriate after a POST request successfully creates a new database record?',
          options: [
            '200 OK',
            '201 Created',
            '204 No Content',
            '304 Not Modified'
          ],
          correctIndex: 1,
          explanation: '201 Created is the standard RFC response for resource creation, often accompanied by a Location header pointing to the new URI.'
        }
      ],
      researchSources: {
        books: [
          {
            title: 'HTTP: The Definitive Guide',
            author: 'David Gourley, Brian Totty, Marjorie Sayer, Sailu Reddy, Anshu Aggarwal',
            year: '2002',
            chapterOrTopic: 'Chapter 3: HTTP Messages & Chapter 4: Connection Management',
            relevance: 'The foundational architectural bible for HTTP methods, headers, status codes, and proxy pipelines.',
            url: 'https://www.oreilly.com/library/view/http-the-definitive/1565925092/',
            libraryLink: 'https://openlibrary.org/works/OL1815124W/HTTP_The_Definitive_Guide'
          },
          {
            title: 'RESTful Web APIs: Services for a Changing World',
            author: 'Leonard Richardson, Mike Amundsen, Sam Ruby',
            year: '2013',
            chapterOrTopic: 'Chapter 2: How the Web Works (Methods & Media Types)',
            relevance: 'Authoritative analysis on idempotent verbs, status code mapping, and Richardson Maturity Model.',
            url: 'https://www.oreilly.com/library/view/restful-web-apis/9781449359713/',
            libraryLink: 'https://openlibrary.org/works/OL16833190W/RESTful_Web_APIs'
          },
          {
            title: 'High Performance Browser Networking',
            author: 'Ilya Grigorik',
            year: '2013',
            chapterOrTopic: 'Chapter 9: Hypertext Transfer Protocol (HTTP)',
            relevance: 'In-depth breakdown of transport mechanics, connection latency, caching headers, and HTTP/2 evolution.',
            url: 'https://hpbn.co/',
            libraryLink: 'https://openlibrary.org/works/OL17088198W/High_Performance_Browser_Networking'
          }
        ],
        websites: [
          {
            title: 'RFC 9110: HTTP Semantics (IETF Standard)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9110',
            sourceType: 'RFC Specification',
            keyContribution: 'Defines the modern, authoritative specification for HTTP methods (GET, POST), safe/idempotent semantics, and status code categories.'
          },
          {
            title: 'MDN Web Docs: HTTP Status Codes Reference',
            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
            sourceType: 'Academic / MDN Guide',
            keyContribution: 'Comprehensive breakdown of 2xx, 4xx, and 5xx status codes with browser compatibility and debugging guidelines.'
          },
          {
            title: 'MDN Web Docs: HTTP Request Methods (GET & POST)',
            url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods',
            sourceType: 'Official Documentation',
            keyContribution: 'Practical reference comparing body payloads, security implications, and caching behavior.'
          }
        ],
        youtubeVideos: [
          {
            title: 'HTTP Crash Course & Network Tab Deep Dive',
            channel: 'Traversy Media',
            approxDuration: '28 minutes',
            recommendedClip: 'Minutes 04:15 - 12:30: Inspecting raw GET vs POST packets and status headers',
            searchQueryOrUrl: 'https://www.youtube.com/watch?v=iYM2zFP3Zn0',
            embedQuery: 'HTTP Crash Course Traversy Media',
            videoId: 'iYM2zFP3Zn0'
          },
          {
            title: 'What Happens When You Type a URL Into Your Browser?',
            channel: 'Fireship',
            approxDuration: '8 minutes',
            recommendedClip: 'Minutes 01:20 - 05:40: DNS, TCP Handshake, and HTTP Request lifecycle',
            searchQueryOrUrl: 'https://www.youtube.com/watch?v=e4S8zfLKUg4',
            embedQuery: 'What happens when you type url Fireship',
            videoId: 'e4S8zfLKUg4'
          },
          {
            title: 'REST API Status Codes Explained in 10 Minutes',
            channel: 'Hussein Nasser',
            approxDuration: '11 minutes',
            recommendedClip: 'Minutes 02:00 - 08:45: Deep dive on 2xx vs 4xx vs 5xx error handling in production',
            searchQueryOrUrl: 'https://www.youtube.com/watch?v=7hpcK5J3W5g',
            embedQuery: 'Hussein Nasser HTTP Status Codes',
            videoId: '7hpcK5J3W5g'
          }
        ]
      },
      referencesSummary: '1. IETF RFC 9110 (2022) "HTTP Semantics" | 2. Gourley et al., "HTTP: The Definitive Guide", O\'Reilly | 3. MDN Web Docs "HTTP Status Codes & Methods" | 4. Grigorik, "High Performance Browser Networking".'
    },
    qc1Report: {
      qcLayer: 'QC Layer 1: Research and Factual Accuracy',
      score: 94,
      status: 'APPROVED',
      summary: 'The lesson demonstrates rigorous factual accuracy and adheres to modern RFC 9110 specifications. Source references cite canonical textbooks (O\'Reilly) and official IETF standards. Minor technical nuances regarding GET payload specs and 401 WWW-Authenticate headers are flagged for refinement.',
      sourceVerification: {
        booksAudited: 3,
        websitesAudited: 3,
        youtubeAudited: 3,
        citationReliabilityScore: 98,
        notes: 'RFC 9110 citations are current and correct. High-caliber textbook citations by Gourley and Grigorik.'
      },
      issues: [
        {
          id: 'qc1-item-1',
          category: 'Technical Inconsistency',
          severity: 'MEDIUM',
          location: 'Section 2: Method Semantics',
          originalTextOrClaim: 'Payload Size: Restricted by URI length (~2048 chars max)',
          critique: 'RFC 9110 does not establish an exact 2048-character limit for URIs; this limit was historically enforced by Microsoft Internet Explorer and specific reverse proxies (e.g. Apache LimitRequestLine). Technically, servers can accept larger URIs unless restricted by configuration.',
          recommendedCorrection: 'Clarify that while the RFC specifies no theoretical maximum URI length, practical browser and web server configurations (like Apache and Nginx) commonly enforce a ~2,000 to 8,000-character safety boundary.',
          autoFixPayload: {
            sectionId: 'sec-2',
            findText: 'Restricted by URI length (~2048 chars max)',
            replacementText: 'Practically constrained (~2,048 chars in legacy browsers/servers; RFC imposes no hard ceiling)'
          },
          applied: false
        },
        {
          id: 'qc1-item-2',
          category: 'Missing Crucial Concept',
          severity: 'LOW',
          location: 'Section 3: Response Taxonomy',
          originalTextOrClaim: '401 Unauthorized: Authentication missing or invalid',
          critique: 'While accurate, the explanation omits the mandatory RFC requirement that 401 responses MUST include a `WWW-Authenticate` header specifying the authentication scheme.',
          recommendedCorrection: 'Note that RFC 9110 mandates a `WWW-Authenticate` response header for 401 responses to inform the user agent which auth scheme (e.g. Bearer, Basic) is expected.',
          autoFixPayload: {
            sectionId: 'sec-3',
            findText: 'Requires `WWW-Authenticate` header.',
            replacementText: 'Mandated by RFC 9110 to return a `WWW-Authenticate` response header (e.g., `WWW-Authenticate: Bearer realm="Access to API"`).'
          },
          applied: false
        }
      ],
      keyStrengths: [
        'Accurate distinction between Safe and Idempotent operations under RFC 9110.',
        'Clear differentiation between 401 Authentication vs 403 Authorization.',
        'Clear practical demonstration of why mutating state in GET triggers destructive crawler accidents.'
      ],
      suggestedRefinements: [
        'Mention HTTP/1.1 chunked transfer encoding briefly for large POST bodies.',
        'Include a note about CORS preflight OPTIONS requests when making POST requests with custom headers from browsers.'
      ]
    },
    qc2Report: {
      qcLayer: 'QC Layer 2: Instructional Quality',
      score: 96,
      status: 'APPROVED',
      summary: 'Exceptional instructional pacing strictly tuned for the 45-minute timeframe. The Learning Objective is 100% covered across every sub-clause (GET/POST differences and 2xx/4xx/5xx distinctions). Cognitive scaffolding progresses seamlessly from conceptual intuition to hands-on CLI diagnostics.',
      objectiveAlignment: {
        statedObjective: 'Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.',
        alignmentPercentage: 100,
        coveredAspects: [
          'GET vs POST safe/idempotent semantics',
          '2xx success status codes (200, 201, 204)',
          '4xx client error status codes (400, 401, 403, 404)',
          '5xx server error status codes (500, 502, 503, 504)'
        ],
        unaddressedOrWeakAspects: []
      },
      timingFeasibility: {
        totalAllocatedMinutes: 45,
        pacingRating: 'EXCELLENT',
        pacingAssessment: 'The 5-phase breakdown (5m hook, 13m concepts, 10m taxonomy, 10m hands-on, 7m quiz) matches optimal educational attention span dynamics.'
      },
      instructionalIssues: [
        {
          id: 'qc2-item-1',
          area: 'Activity Interactivity',
          severity: 'LOW',
          targetSection: 'Section 4: Hands-on Network Diagnostic Lab',
          observedProblem: 'Students without curl installed or in Windows PowerShell may run into alias differences (curl in Windows PowerShell is an alias for Invoke-WebRequest).',
          pedagogicalRecommendation: 'Add a 1-sentence note for Windows students recommending Git Bash, WSL, or Chrome DevTools Network Tab as an alternate execution environment.',
          recommendedImprovement: 'Add Windows platform compatibility note in the interactive curl exercise.',
          autoFixPayload: {
            sectionId: 'sec-4',
            additionalContentOrAdjustment: '> **Tip for Windows Learners**: If running in Windows PowerShell, use \`curl.exe\` instead of \`curl\` to avoid PowerShell\'s built-in \`Invoke-WebRequest\` alias.'
          },
          applied: false
        }
      ],
      pedagogicalPraise: [
        'The bouncer analogy for 401 vs 403 provides instant mental clarity.',
        'Speaker notes give concrete timing anchors for instructor-led classrooms.',
        'The formative 5-question quiz tests edge cases rather than trivial recall.'
      ],
      actionableTakeaways: [
        'Prompt students to predict the status code before running curl commands in Section 4.',
        'Use the 3D Knowledge Core to orient students visually at the 00:00 mark.'
      ]
    }
  }
];
