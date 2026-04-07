import type { LessonScript } from '@/components/AnimatedLessonPlayer'

/**
 * Hardcoded platform explainer tour — plays instantly in AnimatedLessonPlayer.
 * No AI generation needed. Update this whenever the platform adds new features.
 */
export const PLATFORM_TOUR: LessonScript = {
  title: 'Welcome to ZimLearn',
  subject: 'ZimLearn Platform',
  topic: 'How ZimLearn Works',
  level: 'All Levels',
  slides: [
    {
      id: '1',
      type: 'title',
      heading: 'Welcome to ZimLearn',
      emoji: '🎓',
      color: 'emerald',
      narration:
        "Welcome to ZimLearn — Zimbabwe's most advanced AI-powered learning platform, built specifically for ZIMSEC students. Whether you are studying for your Primary School Leaving Examination, your O-Level results, or pushing for A-Level distinctions, ZimLearn is your personal study partner available twenty-four hours a day, seven days a week. In the next few minutes, I am going to walk you through everything you can do on this platform and show you exactly how it helps you reach your full potential. Let us dive in.",
    },
    {
      id: '2',
      type: 'bullets',
      heading: 'What is ZimLearn?',
      emoji: '🌍',
      color: 'blue',
      bullets: [
        "Zimbabwe's first AI-powered ZIMSEC learning platform",
        'Covers Primary, O-Level and A-Level curriculum',
        'Available 24/7 on any device — phone, tablet or computer',
        'Free to start — no credit card, no data bundles required',
      ],
      narration:
        "ZimLearn is Zimbabwe's first and only AI-powered learning platform built around the ZIMSEC curriculum. First — we cover everything from Primary school all the way through to A-Level, so no matter what stage you are at, ZimLearn has you covered. Second — it works on any device. Whether you have a smartphone in Binga or a laptop in Harare, you can access your lessons. Third — it is available twenty-four hours a day, even at night when no teacher is around. And fourth — it is completely free to get started. No credit cards, no sign-up fees. Just create your account and begin learning today.",
    },
    {
      id: '3',
      type: 'example',
      heading: 'Getting Started — 3 Simple Steps',
      emoji: '🚀',
      color: 'teal',
      problem: 'How do I go from zero to studying on ZimLearn?',
      steps: [
        'Step 1 — Create your free account at zim-elearningai.co.zw, choose your ZIMSEC level and grade, and pick the subjects you are studying',
        'Step 2 — MaFundi, your personal AI teacher, sets up your learning profile and shows you exactly which topics to tackle first based on your level',
        'Step 3 — Study through lessons, take quizzes, generate mock exams, watch video lessons, and track your mastery growing every single day',
      ],
      narration:
        "Getting started on ZimLearn takes under two minutes. Step one — go to zim-elearningai.co.zw, create your free account, and tell us your ZIMSEC level, your grade, and your subjects. You can sign up with your Google account in a single tap. Step two — MaFundi, your personal AI teacher, immediately builds your learning profile. It identifies which topics you need to work on and creates a personalised plan just for you. Step three — you start studying. Watch animated video lessons like this one, take AI-generated quizzes, practice with mock exams, and watch your mastery scores rise. Every session gets you closer to the grade you want.",
    },
    {
      id: '4',
      type: 'definition',
      heading: 'Meet MaFundi',
      emoji: '🤖',
      color: 'purple',
      term: 'MaFundi',
      definition:
        'MaFundi (from the Shona word meaning "teacher") is ZimLearn\'s AI teacher — a 24/7 personal tutor that explains any ZIMSEC topic, generates practice materials, and adapts to your individual learning needs.',
      narration:
        "The heart of ZimLearn is MaFundi — and the name comes from the Shona word meaning teacher. MaFundi is your personal AI tutor, available every hour of every day. Unlike a human teacher who has thirty students in a class, MaFundi focuses entirely on you. Ask it to explain photosynthesis and it will give you a full explanation with Zimbabwean examples. Ask it to quiz you on quadratic equations and it will generate ten fresh questions right now. You can even chat with MaFundi in English, Shona, or Ndebele. It is like having the best teacher in Zimbabwe sitting beside you whenever you need help.",
    },
    {
      id: '5',
      type: 'bullets',
      heading: 'What MaFundi Can Do',
      emoji: '⚡',
      color: 'amber',
      bullets: [
        'Explain any ZIMSEC topic in English, Shona or Ndebele',
        'Generate personalised quizzes, mock exams and revision sheets',
        'Create animated video lessons with voice narration',
        'Build weekly study plans and roadmaps tailored to your exams',
      ],
      narration:
        "Let me show you exactly what MaFundi can do. First — you can ask it to explain any topic in your curriculum, and it answers in English, Shona or Ndebele, with examples from Zimbabwe. Second — it generates personalised quizzes and full mock exams in ZIMSEC format, complete with model answers and marking schemes. Third — and this is what you are watching right now — MaFundi creates animated video lessons with voice narration that teach each topic from scratch. Fourth — it builds a full weekly study plan for you based on your upcoming exam dates, so you always know exactly what to study and when.",
    },
    {
      id: '6',
      type: 'bullets',
      heading: 'Track Your Progress',
      emoji: '📊',
      color: 'rose',
      bullets: [
        'See your mastery level for every topic on the syllabus',
        'Earn XP points and maintain daily learning streaks',
        'Get AI-predicted grades based on your quiz performance',
        'Compete on leaderboards with students across Zimbabwe',
      ],
      narration:
        "ZimLearn does not just teach — it shows you how you are improving every single day. First, you get a live mastery map of every topic on your syllabus. Topics you have mastered glow green. Topics that need work are flagged so you know exactly where to focus. Second, you earn XP points and daily streaks for every study session, making learning feel like a game. Third, the AI analyses your quiz scores and predicts your likely grade — so you can see in real time whether you are on track for an A or need to push harder. And fourth, you can compete on the national leaderboard against students from Harare, Bulawayo, Mutare and beyond.",
    },
    {
      id: '7',
      type: 'summary',
      heading: 'Start Your Journey Today',
      emoji: '🌟',
      color: 'indigo',
      points: [
        'Free AI-powered learning built for ZIMSEC — Primary, O-Level & A-Level',
        'MaFundi teaches, quizzes, and plans your studies 24/7',
        'Animated video lessons, mock exams, flashcards and more',
        'Join at zim-elearningai.co.zw — free, instant, no credit card',
      ],
      narration:
        "That is ZimLearn in a nutshell. A free, AI-powered learning platform built specifically for Zimbabwean students from Primary all the way to A-Level. MaFundi is your personal teacher available any time of day or night. You get animated video lessons, personalised quizzes, mock exams, flashcards, study planners, and a live mastery tracker — all in one place. Thousands of students across Zimbabwe are already using ZimLearn to prepare for their ZIMSEC exams. Now it is your turn. Go to zim-elearningai.co.zw, create your free account in under two minutes, and let MaFundi guide you to the grade you deserve. Your future starts today.",
    },
  ],
}
