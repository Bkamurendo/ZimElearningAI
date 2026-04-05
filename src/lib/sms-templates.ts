/**
 * SMS message templates for the ZimLearn platform.
 * All messages are kept within 160 characters where possible
 * to avoid multi-part SMS billing.
 */

export const SMS_TEMPLATES = {
  // ── Account ──────────────────────────────────────────────────────────────────

  /** OTP / MFA code */
  otpVerification: (otp: string) =>
    `ZimLearn: Your OTP is ${otp}. Valid for 10 minutes. Do not share this code.`,

  /** Password reset code */
  passwordReset: (name: string, code: string) =>
    `ZimLearn: Hi ${name}, your password reset code is ${code}. Valid for 10 minutes. Do not share this code.`,

  /** Welcome message sent on registration */
  welcome: (name: string) =>
    `Welcome to ZimLearn, ${name}! Your account is ready. Study smarter with AI-powered ZIMSEC prep. Visit zimlearn.ai`,

  /** Alias kept for backward compat */
  welcomeStudent: (name: string) =>
    `Welcome to ZimLearn, ${name}! Start learning ZIMSEC subjects with AI. Visit zimlearn.ai`,

  // ── Trial / subscription ──────────────────────────────────────────────────────

  /** Trial countdown (generic) */
  trialReminder: (daysLeft: number) =>
    `ZimLearn: Your free Pro trial ends in ${daysLeft} day(s). Upgrade to keep unlimited AI access at zimlearn.ai`,

  /** Named trial countdown used by send helpers */
  trialEnding: (name: string, daysLeft: number) =>
    `Hi ${name}, your ZimLearn Pro trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade now at zimlearn.ai/student/upgrade`,

  // ── Academic ─────────────────────────────────────────────────────────────────

  /** Assignment due-date reminder */
  assignmentDue: (studentName: string, subject: string, dueDate: string) =>
    `Hi ${studentName}, reminder: your ${subject} assignment is due ${dueDate}. Log in to submit at zimlearn.ai`,

  /** Grade posted notification */
  gradePosted: (studentName: string, subject: string, score: string) =>
    `Hi ${studentName}, your ${subject} assignment has been graded: ${score}. Log in to view feedback at zimlearn.ai`,

  /** ZIMSEC exam countdown */
  examReminder: (name: string, subject: string, daysUntil: number) =>
    `ZimLearn: ${name}, your ${subject} ZIMSEC exam is in ${daysUntil} days! Keep practising at zimlearn.ai`,

  /** Daily challenge nudge */
  dailyChallenge: (name: string) =>
    `ZimLearn: Daily challenge is ready, ${name}! Complete it to earn bonus XP. zimlearn.ai/student/challenges`,

  // ── Parent alerts ─────────────────────────────────────────────────────────────

  /** Weekly parent summary */
  parentUpdate: (parentName: string, childName: string, summary: string) =>
    `Hi ${parentName}, weekly update for ${childName}: ${summary}. View full report at zimlearn.ai`,

  /** Child inactivity alert */
  childInactive: (childName: string, days: number) =>
    `ZimLearn Parent Alert: ${childName} hasn't logged in for ${days} days. Encourage them to study!`,

  /** Child badge earned */
  childBadge: (childName: string, badge: string) =>
    `Great news! ${childName} earned the "${badge}" badge on ZimLearn. Keep it up!`,

  // ── School admin ──────────────────────────────────────────────────────────────

  /** School licence expiry warning */
  schoolTrialEnding: (adminName: string, schoolName: string) =>
    `Hi ${adminName}, ${schoolName}'s ZimLearn licence expires soon. Contact us: +263785170918 or visit zimlearn.ai/schools`,

  /** Backward-compat alias */
  schoolRenewal: (schoolName: string, daysLeft: number) =>
    `ZimLearn: ${schoolName} subscription renews in ${daysLeft} days. Contact us: +263785170918`,

  /** Bulk import complete */
  importComplete: (count: number) =>
    `ZimLearn: Bulk import complete. ${count} accounts created successfully.`,

  // ── Cycle Mastery Alerts (Three-Cycle Pass) ──
  cycleMilestone: (studentName: string, subject: string, passNumber: number) => {
    const messages = [
      '',
      `MaFundi: Great news! ${studentName} has finished the FIRST PASS of the ${subject} syllabus. Understanding is building!`,
      `MaFundi Milestone: ${studentName} completed the SECOND PASS of ${subject}. One more pass for 100% ZIMSEC mastery!`,
      `ZimLearn Mastery: ${studentName} has finished the THIRD PASS of ${subject}. 100% Ready for ZIMSEC!`,
    ];
    return messages[passNumber] || messages[1];
  },

  readyPulse: (studentName: string, averagePulse: number) => 
    `MaFundi Parent Alert: ${studentName}'s Ready Pulse is at ${averagePulse}%. Based on repetition cycles, they are ${averagePulse > 80 ? 'READY' : 'PROCEEDING WELL'} for exams.`,
} as const

