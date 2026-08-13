/**
 * Serialize JSON-LD for `dangerouslySetInnerHTML` on a `<script type="application/ld+json">`.
 * Escapes `<` so a string like `</script>` cannot break out of the script block.
 */
export function jsonLdScriptInnerHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
