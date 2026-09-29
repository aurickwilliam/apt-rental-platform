// docx-preview only splits at Word page breaks. For simple flowing documents,
// distribute whole blocks into page-sized sheets without rewriting their styles.
export function paginateDocx(container: HTMLElement): HTMLElement[] {
  const wrapper = container.querySelector<HTMLElement>(".docx-wrapper");
  if (!wrapper) return [];

  for (const page of Array.from(
    wrapper.querySelectorAll<HTMLElement>(":scope > section.docx"),
  )) {
    const articles = page.querySelectorAll<HTMLElement>(":scope > article");
    if (articles.length !== 1) continue;

    const article = articles[0];
    const blocks = Array.from(article.children);
    const pageHeight = parseFloat(getComputedStyle(page).minHeight);
    if (!pageHeight || blocks.length < 2 || page.scrollHeight <= pageHeight + 1)
      continue;

    const styles = getComputedStyle(page);
    const availableHeight =
      pageHeight -
      parseFloat(styles.paddingTop) -
      parseFloat(styles.paddingBottom) -
      Array.from(page.children)
        .filter((child) => child !== article)
        .reduce(
          (height, child) => height + child.getBoundingClientRect().height,
          0,
        );
    if (availableHeight <= 0) continue;

    const template = page.cloneNode(true) as HTMLElement;
    template.querySelector(":scope > article")?.replaceChildren();
    article.replaceChildren();
    page.style.height = `${pageHeight}px`;
    let currentPage = page;
    let currentArticle = article;

    for (const block of blocks) {
      currentArticle.appendChild(block);
      if (
        currentArticle.children.length === 1 &&
        currentArticle.scrollHeight > availableHeight
      ) {
        currentPage.style.height = "auto";
        currentPage.style.overflow = "visible";
      }
      if (
        currentArticle.scrollHeight <= availableHeight ||
        currentArticle.children.length === 1
      ) {
        continue;
      }

      const nextPage = template.cloneNode(true) as HTMLElement;
      const nextArticle =
        nextPage.querySelector<HTMLElement>(":scope > article");
      if (!nextArticle) break;
      nextPage.style.height = `${pageHeight}px`;
      currentPage.after(nextPage);
      nextArticle.appendChild(block);
      currentPage = nextPage;
      currentArticle = nextArticle;
    }
  }

  const pages = Array.from(
    wrapper.querySelectorAll<HTMLElement>(":scope > section.docx"),
  );
  pages.forEach((page, index) => {
    const label = document.createElement("span");
    label.className = "lease-page-label";
    label.setAttribute("aria-hidden", "true");
    label.textContent = `Page ${index + 1} of ${pages.length}`;
    page.after(label);
  });
  return pages;
}
