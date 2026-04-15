/**
 * Email sending via Resend API.
 *
 * Uses the same raw-fetch approach as the existing MFA email route.
 * Add new transactional templates here as named exports.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zimlearn.app'
const FROM = 'ZimLearn AI <noreply@zimlearn.app>'

// ─── Base helper ──────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured — skipping email to', to)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

// ─── Shared HTML shell ────────────────────────────────────────────────────────

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="display:inline-block;background:#059669;border-radius:10px;padding:9px 20px;">
            <span style="color:#fff;font-size:17px;font-weight:800;letter-spacing:-0.3px;">ZimLearn AI</span>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.8;">
            ZimLearn AI · Empowering Zimbabwean students<br>
            <a href="${SITE_URL}/student/upgrade" style="color:#94a3b8;text-decoration:underline;">Manage subscription</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Plan pricing reference row ───────────────────────────────────────────────

const plansRow = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr>
    <td width="33%" style="padding-right:4px;vertical-align:top;">
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;text-align:center;">
        <div style="color:#0284c7;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Starter</div>
        <div style="color:#111827;font-size:20px;font-weight:800;margin-top:4px;">$2<span style="font-size:11px;color:#94a3b8;font-weight:400;">/mo</span></div>
      </div>
    </td>
    <td width="33%" style="padding:0 2px;vertical-align:top;">
      <div style="background:#f0fdf4;border:2px solid #059669;border-radius:8px;padding:12px;text-align:center;">
        <div style="color:#059669;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Pro ★</div>
        <div style="color:#111827;font-size:20px;font-weight:800;margin-top:4px;">$5<span style="font-size:11px;color:#94a3b8;font-weight:400;">/mo</span></div>
      </div>
    </td>
    <td width="33%" style="padding-left:4px;vertical-align:top;">
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;text-align:center;">
        <div style="color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Elite</div>
        <div style="color:#111827;font-size:20px;font-weight:800;margin-top:4px;">$8<span style="font-size:11px;color:#94a3b8;font-weight:400;">/mo</span></div>
      </div>
    </td>
  </tr>
</table>`

// ─── Shared contact/footer block ──────────────────────────────────────────────

const contactBlock = `
<hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0 24px;">
<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 16px;">
  If you have any questions, please reach out:
</p>
<p style="color:#64748b;font-size:13px;line-height:2;margin:0 0 24px;">
  &#128222; <a href="tel:+263785170918" style="color:#059669;text-decoration:none;font-weight:600;">+263 785 170 918</a><br>
  &#128172; Support chatbot on our website<br>
  &#128241; Our social media accounts
</p>
<p style="color:#374151;font-size:14px;font-weight:500;margin:0;">
  Regards,<br>
  <span style="color:#059669;font-weight:700;">Your friends at ZimLearn AI &#127891;</span>
</p>`

// ─── Template: Trial / subscription expired ───────────────────────────────────

export async function sendTrialExpiredEmail(
  to: string,
  name: string | null,
): Promise<void> {
  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,'

  const body = `
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:60px;height:60px;background:#fef2f2;border-radius:50%;line-height:60px;font-size:30px;text-align:center;">&#9200;</div>
    </div>

    <h1 style="color:#111827;font-size:22px;font-weight:800;text-align:center;margin:0 0 20px;letter-spacing:-0.3px;">
      Your trial has expired
    </h1>

    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 12px;">${greeting}</p>
    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Unfortunately you've used up all your days from the trial plan.
      Your account has been reverted to the <strong>Free</strong> plan.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
      To continue using the ZimLearn AI Platform, go to your billing page
      and upgrade your account — plans start from just <strong>$2/month</strong>.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${SITE_URL}/student/upgrade"
         style="display:inline-block;background:#059669;color:#fff;text-decoration:none;
                font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;
                letter-spacing:0.2px;">
        Upgrade plan &rarr;
      </a>
    </div>

    <!-- Plans -->
    ${plansRow}

    ${contactBlock}`

  await sendEmail(
    to,
    'Your ZimLearn trial has expired — upgrade to continue',
    emailShell(body),
  )
}

// ─── Template: Subscription expiring soon ─────────────────────────────────────

export async function sendSubscriptionExpiringSoonEmail(
  to: string,
  name: string | null,
  daysLeft: number,
  planLabel: string,
): Promise<void> {
  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,'
  const dayWord = daysLeft === 1 ? 'day' : 'days'

  const body = `
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:60px;height:60px;background:#fffbeb;border-radius:50%;line-height:60px;font-size:30px;text-align:center;">&#9889;</div>
    </div>

    <h1 style="color:#111827;font-size:22px;font-weight:800;text-align:center;margin:0 0 20px;letter-spacing:-0.3px;">
      Your plan expires in ${daysLeft} ${dayWord}
    </h1>

    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 12px;">${greeting}</p>
    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Your <strong>${planLabel}</strong> plan will expire in
      <strong>${daysLeft} ${dayWord}</strong>. After it expires,
      your account will revert to the Free plan and you&apos;ll lose access
      to premium features.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
      Renew now to keep your streak, AI Tutor access, and all your progress
      without interruption.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${SITE_URL}/student/upgrade"
         style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;
                font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;
                letter-spacing:0.2px;">
        Renew plan &rarr;
      </a>
    </div>

    ${plansRow}

    ${contactBlock}`

  await sendEmail(
    to,
    `Action needed: Your ZimLearn ${planLabel} plan expires in ${daysLeft} ${dayWord}`,
    emailShell(body),
  )
}

// ─── Template: Payment success ────────────────────────────────────────────────

export async function sendPaymentSuccessEmail(
  to: string,
  name: string | null,
  planLabel: string,
  expiresAt: Date,
): Promise<void> {
  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,'
  const expiryStr = expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const body = `
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:60px;height:60px;background:#f0fdf4;border-radius:50%;line-height:60px;font-size:30px;text-align:center;">&#10003;</div>
    </div>

    <h1 style="color:#111827;font-size:22px;font-weight:800;text-align:center;margin:0 0 20px;letter-spacing:-0.3px;">
      Payment confirmed!
    </h1>

    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 12px;">${greeting}</p>
    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Your payment was successful. You now have access to the
      <strong>${planLabel}</strong> plan on ZimLearn AI.
    </p>

    <!-- Plan details box -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:13px;">Plan</td>
          <td align="right" style="color:#059669;font-size:15px;font-weight:700;">${planLabel}</td>
        </tr>
        <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #d1fae5;"></td></tr>
        <tr>
          <td style="color:#64748b;font-size:13px;">Access until</td>
          <td align="right" style="color:#111827;font-size:14px;font-weight:600;">${expiryStr}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${SITE_URL}/student/dashboard"
         style="display:inline-block;background:#059669;color:#fff;text-decoration:none;
                font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;
                letter-spacing:0.2px;">
        Start learning &rarr;
      </a>
    </div>

    ${contactBlock}`

  await sendEmail(
    to,
    `Payment confirmed — Welcome to ZimLearn AI ${planLabel}!`,
    emailShell(body),
  )
}
