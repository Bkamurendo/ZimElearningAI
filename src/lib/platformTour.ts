import type { LessonScript } from '@/components/AnimatedLessonPlayer'

/**
 * Comprehensive platform feature tour — covers every major module.
 * Plays instantly in AnimatedLessonPlayer, no AI call needed.
 * Update this whenever the platform adds significant new features.
 */
export const PLATFORM_TOUR: LessonScript = {
  title: 'The Complete ZimLearn Platform Tour',
  subject: 'ZimLearn Platform',
  topic: 'All Modules & Features',
  level: 'All Levels',
  slides: [

    // ── 1. TITLE ──────────────────────────────────────────────────────────────
    {
      id: '1',
      type: 'title',
      heading: 'The Complete ZimLearn Platform Tour',
      emoji: '🎓',
      color: 'emerald',
      narration:
        "Welcome to ZimLearn — Zimbabwe's most advanced AI-powered learning platform, built specifically around the ZIMSEC curriculum. In this video I am going to walk you through every single module and feature available to you, from your personal dashboard all the way through to AI-generated video lessons, study squads, tournaments, and your grade predictor. Whether you are a Primary pupil, an O-Level student, or pushing for A-Level distinctions, every tool on this platform is designed to get you the grade you deserve. Let us start the tour.",
    },

    // ── 2. DASHBOARD ─────────────────────────────────────────────────────────
    {
      id: '2',
      type: 'bullets',
      heading: 'Your Dashboard — Command Centre',
      emoji: '🏠',
      color: 'blue',
      bullets: [
        'Live stats — lessons done, quizzes completed, topics mastered',
        'Daily streak counter and total XP earned across all subjects',
        'Enrolled subjects with individual progress bars',
        'Quick-access shortcuts to every major tool',
      ],
      narration:
        "When you log in, the first thing you see is your personal dashboard — your command centre. At the top are four live stat cards showing how many lessons you have completed, how many quizzes you have done, how many topics you have mastered, and your current daily learning streak. Below that are your enrolled subjects, each with a progress bar showing how far through the syllabus you are. The dashboard also surfaces quick-access buttons to MaFundi, the AI Workspace, your Study Planner, and Flashcards, so you can jump straight into any tool with a single tap.",
    },

    // ── 3. MAFUNDI AI TEACHER ─────────────────────────────────────────────────
    {
      id: '3',
      type: 'bullets',
      heading: 'MaFundi — Your Personal AI Teacher',
      emoji: '🤖',
      color: 'purple',
      bullets: [
        'Chat Mode — ask any ZIMSEC question and get a full explanation',
        'Quiz Me Mode — MaFundi generates and marks inline quizzes live',
        'Study Plan Mode — builds a personalised week-by-week revision roadmap',
        'Past Paper Mode — solves and explains past ZIMSEC exam questions',
      ],
      narration:
        "MaFundi is the heart of ZimLearn — your personal AI teacher available twenty-four hours a day. In the AI Teacher page you choose from four powerful modes. Chat Mode lets you ask any question and get a full, curriculum-aligned explanation with Zimbabwean examples. Quiz Me Mode generates fresh questions on any topic and marks your answers instantly with explanations. Study Plan Mode analyses your subjects and exam dates and builds you a complete week-by-week revision roadmap. And Past Paper Mode takes real ZIMSEC questions and walks you through the full solution with marking scheme tips. You can switch between modes at any time.",
    },

    // ── 4. MAFUNDI EXTRA FEATURES ─────────────────────────────────────────────
    {
      id: '4',
      type: 'bullets',
      heading: 'MaFundi Extra Features',
      emoji: '⚡',
      color: 'teal',
      bullets: [
        'Voice input — speak your question instead of typing',
        'Image & PDF upload — photograph a textbook or past paper and ask about it',
        'Text-to-speech — MaFundi reads answers aloud to you',
        'English, Shona or Ndebele — choose your preferred language',
      ],
      narration:
        "MaFundi goes far beyond a simple chatbot. You can use voice input to speak your question directly into the microphone — no typing needed. You can photograph a textbook page, a handwritten problem, or a past paper question and upload it, and MaFundi will analyse the image and answer it. Every response MaFundi gives can be read aloud using text-to-speech, which is perfect for auditory learners or for when you want to listen while you study. And you can have the entire conversation in English, Shona, or Ndebele — whatever language you learn best in. You can also save any of MaFundi's responses directly to your personal notes.",
    },

    // ── 5. AI WORKSPACE ───────────────────────────────────────────────────────
    {
      id: '5',
      type: 'example',
      heading: 'AI Workspace — Generate Study Materials',
      emoji: '✨',
      color: 'indigo',
      problem: 'How do I use MaFundi to create study materials for my upcoming Biology O-Level exam?',
      steps: [
        'Click "Generate Notes" → pick Biology → type a topic (e.g. Cell Division) → MaFundi produces full ZIMSEC-aligned notes with diagrams and exam tips in ~20 seconds',
        'Click "Generate Mock Exam" → pick Biology → select Paper 2 → get a full structured ZIMSEC exam with model answers and marking scheme in ~30 seconds',
        'Click "Video Lesson" → pick a topic → MaFundi builds an animated video lesson with voice narration, worked examples, equations and diagrams that plays right here in the browser',
      ],
      narration:
        "The AI Workspace is where MaFundi creates personalised study materials for you on demand. Let me walk through it. First, click Generate Notes, pick your subject, type the topic — for example Cell Division in Biology — and in about twenty seconds MaFundi produces comprehensive, ZIMSEC-aligned notes complete with diagrams and exam tips, saved automatically to your Notes. Second, click Generate Mock Exam, pick your subject and paper type, and get a full exam in ZIMSEC format with model answers — prioritising your weak topics. Third, click Video Lesson, enter a topic, and MaFundi builds a full animated video lesson with voice narration, equations, definitions, worked examples and diagrams that plays instantly in your browser — exactly like what you are watching right now.",
    },

    // ── 6. PROGRESS & MASTERY ─────────────────────────────────────────────────
    {
      id: '6',
      type: 'bullets',
      heading: 'Progress & Syllabus Mastery',
      emoji: '📊',
      color: 'rose',
      bullets: [
        'Interactive mastery heatmap — every topic on your syllabus colour-coded',
        'Four mastery levels: Mastered ✅, Competent, Learning, Not Started',
        'Per-subject progress bars showing lesson and quiz completion percentages',
        'Weak topics automatically flagged and sent to MaFundi for remediation',
      ],
      narration:
        "The Progress page gives you a live, interactive view of exactly where you stand on every topic in your syllabus. Each subject has a mastery heatmap — a grid of every topic colour-coded by your level. Green means you have mastered it. Yellow means you are competent. Orange means you are still learning. And grey means you have not started yet. You can filter by any mastery level to see only the topics that need work. When topics are flagged as weak, the Workspace automatically surfaces them with a lightning bolt button — one tap tells MaFundi to generate a targeted revision sheet for that exact topic right away.",
    },

    // ── 7. STUDY PLANNER ─────────────────────────────────────────────────────
    {
      id: '7',
      type: 'bullets',
      heading: 'Study Planner',
      emoji: '📅',
      color: 'amber',
      bullets: [
        'AI generates a personalised weekly study schedule based on your subjects',
        'Exam dates from your timetable are factored into the plan automatically',
        'Weak topics are prioritised and scheduled first',
        'Day-by-day breakdown showing exactly what to study each session',
      ],
      narration:
        "The Study Planner solves one of the biggest problems students face — not knowing what to study or when. Open the Study Planner, add your exam dates, and MaFundi immediately generates a complete personalised weekly schedule. It analyses all your subjects, cross-references your mastery levels to identify the weakest topics, checks how many days you have until each exam, and builds a realistic day-by-day plan that fits everything in. Each session in the plan tells you exactly which subject, which topic, and how long to spend. Your plan updates automatically as your mastery improves, so it is always relevant and never wastes your time on things you already know.",
    },

    // ── 8. FLASHCARDS ────────────────────────────────────────────────────────
    {
      id: '8',
      type: 'bullets',
      heading: 'Flashcards',
      emoji: '🃏',
      color: 'blue',
      bullets: [
        'Create custom flashcards manually for any topic or subject',
        'AI-generate a full deck of flashcards from any lesson in seconds',
        'Flip animation reveals the answer — tap to mark Known or Try Again',
        'Spaced repetition tracks which cards you struggle with most',
      ],
      narration:
        "Flashcards are one of the most powerful revision tools on ZimLearn. You can create your own flashcards manually — type a question on the front, the answer on the back — or you can let MaFundi generate an entire deck automatically for any topic. During a review session the card appears face-up with the question. You think through your answer, then tap the card to flip it and reveal the correct answer with a satisfying animation. You then mark it as Known or Try Again. ZimLearn tracks which cards you struggle with and shows them more frequently, using spaced repetition so you spend your time on what actually needs work rather than what you already know.",
    },

    // ── 9. EXAM TIMETABLE & DAILY CHALLENGES ──────────────────────────────────
    {
      id: '9',
      type: 'bullets',
      heading: 'Exam Timetable & Daily Challenges',
      emoji: '📆',
      color: 'rose',
      bullets: [
        'Add all your ZIMSEC exam dates, paper numbers and times in one place',
        'Countdown chips turn red as exam day approaches — urgent reminders',
        'MaFundi auto-generates targeted revision for each upcoming exam',
        'Daily Challenges — a fresh set of ZIMSEC questions every single day',
      ],
      narration:
        "The Exam Timetable lets you add every ZIMSEC exam you are sitting — subject, paper number, date and time. Once added, each exam shows a live countdown chip that turns from green to amber to red as the exam day approaches. MaFundi uses these dates to prioritise your study plan and automatically generate revision materials for the exams coming up soonest. Alongside the timetable, Daily Challenges give you a fresh set of ZIMSEC-style questions every single day — different topics, different subjects, keeping your brain sharp. Complete the daily challenge to earn bonus XP and see how your score compares with other ZimLearn students on the daily leaderboard.",
    },

    // ── 10. GRADE PREDICTOR & PROBLEM SOLVER ─────────────────────────────────
    {
      id: '10',
      type: 'bullets',
      heading: 'Grade Predictor & Problem Solver',
      emoji: '🎯',
      color: 'purple',
      bullets: [
        'Grade Predictor — AI analyses your quiz scores and predicts your final ZIMSEC grade',
        'See a confidence score and which topics to improve to move up a grade',
        'Problem Solver — paste any question and get a full step-by-step solution',
        'Upload a photo of a problem from your textbook or past paper for instant help',
      ],
      narration:
        "The Grade Predictor is one of ZimLearn's most powerful tools. It analyses your quiz performance across all topics, weighs them against the ZIMSEC marking distribution, and gives you a predicted grade for each subject — from Ungraded all the way up to A. It also tells you which specific topics to improve to push your grade up one level. The Problem Solver is your instant homework helper. Type or paste any problem — a quadratic equation, a biology question, a history essay prompt — and MaFundi gives you a complete step-by-step solution with working shown at every stage, exactly as the ZIMSEC examiner expects. You can also photograph a problem directly from your textbook.",
    },

    // ── 11. LEADERBOARD, XP & TOURNAMENTS ────────────────────────────────────
    {
      id: '11',
      type: 'bullets',
      heading: 'Leaderboard, XP & Tournaments',
      emoji: '🏆',
      color: 'amber',
      bullets: [
        'Earn XP for every lesson, quiz, challenge and study session completed',
        'Maintain daily learning streaks — longer streaks earn bonus XP multipliers',
        'National leaderboard — see your rank among all ZimLearn students',
        'Live tournaments with prizes — compete in timed ZIMSEC quiz competitions',
      ],
      narration:
        "ZimLearn turns studying into a game. Every action you take earns XP — completing a lesson, finishing a quiz, hitting your daily challenge, maintaining your streak. The longer your streak, the higher your XP multiplier. Your total XP places you on the national leaderboard ranked against students from Harare, Bulawayo, Mutare, Gweru and everywhere across Zimbabwe. You can filter the leaderboard by your ZIMSEC level so you are competing fairly with students in the same cohort. Tournaments take competition further — timed ZIMSEC quiz competitions with real prizes where hundreds of students compete simultaneously. Tournament results are updated live and the top performers are celebrated on the platform.",
    },

    // ── 12. STUDY SQUADS, NOTES, ASSIGNMENTS & RESOURCES ─────────────────────
    {
      id: '12',
      type: 'bullets',
      heading: 'Squads, Notes, Assignments & Resources',
      emoji: '📚',
      color: 'teal',
      bullets: [
        'Study Squads — create or join groups to study together and share resources',
        'Notes — all your AI-generated and personal notes saved in one searchable place',
        'Assignments — submit teacher-set work and receive AI-marked feedback',
        'Resource Library — ZIMSEC past papers, syllabi, mark schemes and textbooks',
      ],
      narration:
        "ZimLearn has a full suite of collaboration and content tools. Study Squads let you create or join study groups — invite classmates, share resources, and motivate each other. Your Notes page is a searchable library of everything MaFundi has generated for you — notes, revision sheets, mock exams — plus any personal notes you have written. The Assignments section is where your teacher posts work for submission. You upload your response and get feedback with a grade. And the Resource Library is a curated collection of real ZIMSEC materials — past papers going back years, official marking schemes, ZIMSEC syllabi for every subject, study notes and textbooks, all filterable by level and subject.",
    },

    // ── 13. SUMMARY ───────────────────────────────────────────────────────────
    {
      id: '13',
      type: 'summary',
      heading: 'Everything You Need. One Platform.',
      emoji: '🌟',
      color: 'indigo',
      points: [
        'MaFundi AI Teacher — chat, quiz, study plans, past papers, video lessons',
        'Progress tracking — mastery heatmaps, grade predictor, exam timetable',
        'Study tools — planner, flashcards, problem solver, resource library',
        'Community — leaderboard, tournaments, study squads, daily challenges',
      ],
      narration:
        "That is the complete ZimLearn platform. MaFundi your AI teacher is available twenty-four hours a day in Chat, Quiz, Study Plan and Past Paper mode — and now builds animated video lessons like this one. Your Progress page tracks mastery on every single syllabus topic. The Grade Predictor shows your predicted ZIMSEC grade in real time. The Study Planner, Flashcards, Problem Solver and Resource Library give you every revision tool you need. And the Leaderboard, Daily Challenges, Tournaments and Study Squads make studying social and competitive. Everything is free to start. Go to zim-elearningai.co.zw right now, create your account in under two minutes, and let MaFundi guide you to the grade you deserve. Your ZIMSEC success starts today.",
    },
  ],
}
