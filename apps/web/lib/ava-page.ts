/** The full-page Ava (tenant portal). `chat` opens one of the saved conversations. */
export const AVA_PAGE_PATH = "/tenant/ava";

export function avaPageHref(chatId?: string | null): string {
  return chatId ? `${AVA_PAGE_PATH}?chat=${encodeURIComponent(chatId)}` : AVA_PAGE_PATH;
}
