import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1'

import { escapeHtml, renderEmail } from './templates.ts'

Deno.test('escapeHtml neutralizes markup', () => {
  assertEquals(escapeHtml(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;')
})

Deno.test('listing_hidden names the listing and reason, escaped', () => {
  const email = renderEmail('listing_hidden', { apartmentName: 'A <script>', reason: 'Fake photos' })
  assertEquals(email.subject, 'Your APT listing was hidden')
  assertStringIncludes(email.html, 'A &lt;script&gt;')
  assert(!email.html.includes('<script>'))
  assertStringIncludes(email.text, 'Reason: Fake photos')
})

Deno.test('account_suspended is permanent without an end date and dated with one', () => {
  const permanent = renderEmail('account_suspended', { reason: 'Scam', until: null })
  assertStringIncludes(permanent.text, 'until our team reactivates it')

  const temporary = renderEmail('account_suspended', { reason: 'Scam', until: '2026-12-01T04:00:00.000Z' })
  assertStringIncludes(temporary.text, 'suspended until')
  assertStringIncludes(temporary.text, '2026')
})

Deno.test('warning distinguishes listings from accounts', () => {
  assertStringIncludes(renderEmail('warning', { note: 'x', aboutListing: true }).text, 'about your listing')
  assertStringIncludes(renderEmail('warning', { note: 'x', aboutListing: false }).text, 'about your account')
})

Deno.test('report_reviewed never reveals the outcome', () => {
  const email = renderEmail('report_reviewed', { outcome: 'listing_hidden' })
  assertStringIncludes(email.text, 'we do not share what was decided')
  assert(!email.text.includes('listing_hidden'))
})

Deno.test('missing params fall back to safe defaults', () => {
  assertStringIncludes(renderEmail('listing_hidden', {}).text, '"Your listing"')
  assertStringIncludes(renderEmail('warning', {}).text, 'Please review our community rules.')
})

Deno.test('listing_restored names the listing', () => {
  const email = renderEmail('listing_restored', { apartmentName: 'Sunrise Apartment' })
  assertEquals(email.subject, 'Your APT listing is visible again')
  assertStringIncludes(email.text, '"Sunrise Apartment" is visible in search again')
})

Deno.test('account_reactivated says whether the suspension ended on its own', () => {
  assertStringIncludes(renderEmail('account_reactivated', { automatic: true }).text, 'suspension has ended')
  assertStringIncludes(renderEmail('account_reactivated', {}).text, 'reactivated your account')
})

Deno.test('emails use the APT logo, a card layout and no scripts or external fonts', () => {
  const email = renderEmail('warning', { note: 'Fix the price', aboutListing: true })
  assertStringIncludes(email.html, 'email-assets/apt-logo.png')
  assertStringIncludes(email.html, 'Message from our team')
  assert(!email.html.includes('<script'))
  assert(!email.html.includes('fonts.googleapis'))
  assert(email.html.length < 20_000)
})

Deno.test('listing_review_declined shows the admin message and says how to try again', () => {
  const email = renderEmail('listing_review_declined', { apartmentName: 'Sunrise', note: 'Photos still look stolen' })
  assertEquals(email.subject, 'Your listing review request was declined')
  assertStringIncludes(email.text, 'Message from our team: Photos still look stolen')
  assertStringIncludes(email.text, 'send another review request')
})
