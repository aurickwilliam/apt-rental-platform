/**
 * The line above a reply in a chat thread (Instagram wording), shared by web
 * and mobile. `replierIsMe` is whether the reply bubble is mine; `quotedIsMine`
 * whether the message it quotes is mine. `otherName` is the other participant.
 */
export function getReplyCaption(params: {
  replierIsMe: boolean;
  quotedIsMine: boolean | null;
  otherName?: string | null;
}): string {
  const name = params.otherName?.trim() || 'Someone';
  // `null`: the original is gone, so there is nobody to name.
  if (params.quotedIsMine === null) return params.replierIsMe ? 'You replied' : `${name} replied`;
  if (params.replierIsMe) return params.quotedIsMine ? 'You replied to yourself' : `You replied to ${name}`;
  return params.quotedIsMine ? `${name} replied to you` : `${name} replied to themself`;
}
