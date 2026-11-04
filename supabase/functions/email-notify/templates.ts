// Moderation emails: fixed templates rendered from a queued row's params. The
// function never sends free-form text from a request, so it cannot be used to
// mail arbitrary content. Plain inline HTML, no fonts or images: emails over
// ~102 KB are clipped by Gmail.

export type EmailTemplate =
  | 'listing_hidden'
  | 'listing_restored'
  | 'account_suspended'
  | 'account_reactivated'
  | 'warning'
  | 'report_reviewed'

export const EMAIL_TEMPLATES: readonly EmailTemplate[] = [
  'listing_hidden',
  'listing_restored',
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

function layout(heading: string, paragraphs: string[]): { html: string; text: string } {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px">${escapeHtml(p)}</p>`).join('')
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2933;` +
    `max-width:520px;margin:0 auto;padding:24px">` +
    `<h1 style="font-size:20px;margin:0 0 16px;color:#376BF5">${escapeHtml(heading)}</h1>${body}` +
    `<p style="margin:24px 0 0;font-size:12px;color:#6C757D">APT (A Place to Thrive). ` +
    `Reply to this email or contact support if you think this is a mistake.</p></div>`
  return { html, text: [heading, '', ...paragraphs].join('\n') }
}

export function renderEmail(template: EmailTemplate, params: Params): RenderedEmail {
  switch (template) {
    case 'listing_hidden': {
      const name = text(params.apartmentName, 'Your listing')
      const reason = text(params.reason, 'It did not meet our listing rules.')
      return {
        subject: 'Your APT listing was hidden',
        ...layout('Your listing was hidden', [
          `"${name}" is hidden from search after our team reviewed a report.`,
          `Reason: ${reason}`,
          'You can still see the listing in your account. We will let you know if it is restored.',
        ]),
      }
    }
    case 'listing_restored': {
      const name = text(params.apartmentName, 'Your listing')
      return {
        subject: 'Your APT listing is visible again',
        ...layout('Your listing is visible again', [
          `"${name}" is visible in search again after our team's review.`,
          'Thank you for your patience.',
        ]),
      }
    }
    case 'account_reactivated':
      return {
        subject: 'Your APT account is active again',
        ...layout('Your account is active again', [
          params.automatic === true
            ? 'Your suspension has ended.'
            : 'Our team reactivated your account.',
          'You can sign in and use APT as usual.',
        ]),
      }
    case 'account_suspended': {
      const reason = text(params.reason, 'Your account broke our rules.')
      const until = formatUntil(params.until)
      return {
        subject: 'Your APT account was suspended',
        ...layout('Your account was suspended', [
          until
            ? `Your account is suspended until ${until} (Manila time).`
            : 'Your account is suspended until our team reactivates it.',
          `Reason: ${reason}`,
          'You cannot use APT while the suspension is active.',
        ]),
      }
    }
    case 'warning': {
      const note = text(params.note, 'Please review our community rules.')
      const subject = params.aboutListing === true ? 'your listing' : 'your account'
      return {
        subject: 'A warning from the APT team',
        ...layout('A warning from the APT team', [
          `Our team reviewed a report about ${subject} and is sending you a warning.`,
          `Message from our team: ${note}`,
          'Further reports may lead to hiding listings or suspending the account.',
        ]),
      }
    }
    case 'report_reviewed':
      return {
        subject: 'We reviewed your report',
        ...layout('We reviewed your report', [
          'Our team reviewed the report you sent. Thank you for helping keep APT safe.',
          'For privacy, we do not share what was decided.',
        ]),
      }
  }
}
