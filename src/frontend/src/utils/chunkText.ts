/**
 * Chunk text cleaning utilities.
 *
 * Raw chunk content from the tree index contains markdown headers,
 * physical_index markers, and embedded footers. These helpers clean
 * the text for display in both the chat stream and the session ledger.
 */

/** Strip <physical_index_N> markers. */
function stripPhysicalIndex(text: string): string {
  return text.replace(/<physical_index_\d+>/g, "");
}

/** Strip markdown heading markers (##, ###, ####) at line starts. */
function stripMarkdownHeadings(text: string): string {
  return text.replace(/^#{1,6}\s+/gm, "");
}

/** Strip embedded 10-K footer lines like "Apple Inc. | 2024 Form 10-K | 25". */
function stripFooterLines(text: string): string {
  return text.replace(/^.+\|\s*\d{4}\s+Form\s+10-K\s*\|\s*\d+\s*$/gm, "");
}

/** Collapse multiple blank lines into one. */
function collapseWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Clean chunk text for plain-text display (previews, selector cards).
 * Strips all markdown artifacts and returns clean readable text.
 */
export function cleanChunkPreview(text: string): string {
  let cleaned = stripPhysicalIndex(text);
  cleaned = stripMarkdownHeadings(cleaned);
  cleaned = stripFooterLines(cleaned);
  cleaned = collapseWhitespace(cleaned);
  return cleaned;
}

/**
 * Clean chunk text for markdown rendering (detail views).
 * Keeps markdown structure but strips artifacts like physical_index and footers.
 */
export function cleanChunkMarkdown(text: string): string {
  let cleaned = stripPhysicalIndex(text);
  cleaned = stripFooterLines(cleaned);
  cleaned = collapseWhitespace(cleaned);
  return cleaned;
}
