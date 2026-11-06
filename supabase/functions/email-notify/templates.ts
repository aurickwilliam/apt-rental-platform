// Moderation emails: fixed templates rendered from a queued row's params. The
// function never sends free-form text from a request, so it cannot be used to
// mail arbitrary content. Plain inline HTML with one small hosted logo and no
// web fonts: emails over ~102 KB are clipped by Gmail.

export type EmailTemplate =
  | 'lease_renewal_update'
  | 'listing_hidden'
  | 'listing_restored'
  | 'listing_review_declined'
  | 'account_suspended'
  | 'account_reactivated'
  | 'warning'
  | 'report_reviewed'

export const EMAIL_TEMPLATES: readonly EmailTemplate[] = [
  'lease_renewal_update',
  'listing_hidden',
  'listing_restored',
  'listing_review_declined',
  'account_suspended',
  'account_reactivated',
  'warning',
  'report_reviewed',
]

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

type Params = Record<string, unknown>

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 600) : fallback

function formatUntil(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(date)
}

const LOGO_URL = 'https://ezxirkpgfpripjydcqnt.supabase.co/storage/v1/object/public/email-assets/apt-logo.png'
const HEADING_FONT = "Nunito, 'Nunito Sans', ui-rounded, 'Segoe UI', Roboto, Arial, sans-serif"
const BODY_FONT = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

interface Content {
  heading: string
  intro: string[]
  /** A highlighted block for the admin's reason or message. */
  callout?: { label: string; text: string }
  outro?: string[]
}

// Same look as the sign-in code emails: grey page, logo, white rounded card.
// Tables and inline styles only (email clients ignore most other CSS).
function layout({ heading, intro, callout, outro = [] }: Content): { html: string; text: string } {
  const paragraph = (p: string, color = '#374151') =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${color};text-align:left">${escapeHtml(p)}</p>`
  const calloutHtml = callout
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
      `style="margin:8px 0 20px;background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px">` +
      `<tr><td style="padding:16px 20px">` +
      `<p style="margin:0 0 4px;font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.05em;` +
      `text-transform:uppercase;color:#376BF5">${escapeHtml(callout.label)}</p>` +
      `<p style="margin:0;font-size:16px;line-height:24px;color:#1F2933">${escapeHtml(callout.text)}</p>` +
      `</td></tr></table>`
    : ''
  const html =
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<title>${escapeHtml(heading)}</title></head>` +
    `<body style="margin:0;padding:0;background-color:#F8F9FA;font-family:${BODY_FONT}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8F9FA">` +
    `<tr><td align="center" style="padding:40px 16px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">` +
    `<tr><td align="center" style="padding:0 0 24px">` +
    `<img src="${LOGO_URL}" width="80" height="80" alt="APT" style="display:block;margin:0 auto;border:0" /></td></tr>` +
    `<tr><td style="background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;padding:36px 32px">` +
    `<h1 style="margin:0 0 20px;font-family:${HEADING_FONT};font-weight:700;font-size:24px;line-height:32px;` +
    `color:#333333;text-align:left">${escapeHtml(heading)}</h1>` +
    intro.map((p) => paragraph(p)).join('') +
    calloutHtml +
    outro.map((p) => paragraph(p, '#6C757D')).join('') +
    `</td></tr>` +
    `<tr><td align="center" style="padding:24px 16px 0">` +
    `<p style="margin:0;font-size:12px;line-height:18px;color:#6C757D">APT - A Place to Thrive</p>` +
    `<p style="margin:4px 0 0;font-size:12px;line-height:18px;color:#9CA3AF">You're receiving this email because of ` +
    `activity on your APT account. If you think this is a mistake, contact APT support.</p>` +
    `</td></tr></table></td></tr></table></body></html>`
  const text = [
    heading,
    '',
    ...intro,
    ...(callout ? [`${callout.label}: ${callout.text}`] : []),
    ...outro,
  ].join('\n')
  return { html, text }
}

export function renderEmail(template: EmailTemplate, params: Params): RenderedEmail {
  switch (template) {
    case 'lease_renewal_update':
      return {
        subject: text(params.title, 'Your APT lease renewal'),
        ...layout({
          heading: text(params.title, 'Your lease renewal'),
          intro: [text(params.body, 'Your lease renewal has been updated.')],
          outro: ['Open your rental or property in APT to review the current terms and next step. No payment or agreement is accepted automatically.'],
        }),
      }
    case 'listing_hidden': {
      const name = text(params.apartmentName, 'Your listing')
      const reason = text(params.reason, 'It did not meet our listing rules.')
      return {
        subject: 'Your APT listing was hidden',
        ...layout({
          heading: 'Your listing was hidden',
          intro: [`"${name}" is hidden from search after our team reviewed a report.`],
          callout: { label: 'Reason', text: reason },
          outro: ['You can still see the listing in your account. We will let you know if it is restored.'],
        }),
      }
    }
    case 'listing_restored': {
      const name = text(params.apartmentName, 'Your listing')
      return {
        subject: 'Your APT listing is visible again',
        ...layout({
          heading: 'Your listing is visible again',
          intro: [`"${name}" is visible in search again after our team's review.`, 'Thank you for your patience.'],
        }),
      }
    }
    case 'listing_review_declined': {
      const name = text(params.apartmentName, 'Your listing')
      const note = text(params.note, 'The listing still needs changes.')
      return {
        subject: 'Your listing review request was declined',
        ...layout({
          heading: 'Your review request was declined',
          intro: [`Our team reviewed your request for "${name}" and is keeping it hidden for now.`],
          callout: { label: 'Message from our team', text: note },
          outro: ['Update the listing and send another review request when it is ready.'],
        }),
      }
    }
    case 'account_reactivated':
      return {
        subject: 'Your APT account is active again',
        ...layout({
          heading: 'Your account is active again',
          intro: [
            params.automatic === true ? 'Your suspension has ended.' : 'Our team reactivated your account.',
            'You can sign in and use APT as usual.',
          ],
        }),
      }
    case 'account_suspended': {
      const reason = text(params.reason, 'Your account broke our rules.')
      const until = formatUntil(params.until)
      return {
        subject: 'Your APT account was suspended',
        ...layout({
          heading: 'Your account was suspended',
          intro: [
            until
              ? `Your account is suspended until ${until} (Manila time).`
              : 'Your account is suspended until our team reactivates it.',
          ],
          callout: { label: 'Reason', text: reason },
          outro: ['You cannot use APT while the suspension is active.'],
        }),
      }
    }
    case 'warning': {
      const note = text(params.note, 'Please review our community rules.')
      const subject = params.aboutListing === true ? 'your listing' : 'your account'
      return {
        subject: 'A warning from the APT team',
        ...layout({
          heading: 'A warning from the APT team',
          intro: [`Our team reviewed a report about ${subject} and is sending you a warning.`],
          callout: { label: 'Message from our team', text: note },
          outro: ['Further reports may lead to hiding listings or suspending the account.'],
        }),
      }
    }
    case 'report_reviewed':
      return {
        subject: 'We reviewed your report',
        ...layout({
          heading: 'We reviewed your report',
          intro: [
            'Our team reviewed the report you sent. Thank you for helping keep APT safe.',
            'For privacy, we do not share what was decided.',
          ],
        }),
      }
  }
}
