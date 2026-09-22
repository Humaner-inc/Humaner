import * as React from 'react';

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'UL',
  'OL',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'HR',
  'STRONG',
  'EM',
  'B',
  'I',
  'A',
  'DIV',
  'SPAN'
]);

function safeHref(href: string | null): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) {
    return undefined;
  }
  if (/^(https?:|mailto:)/i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function mapNode(node: ChildNode, key: number): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as Element;
  const tag = el.tagName.toUpperCase();
  const children = Array.from(el.childNodes).map((child, index) =>
    mapNode(child, index)
  );

  if (!ALLOWED_TAGS.has(tag)) {
    return <React.Fragment key={key}>{children}</React.Fragment>;
  }

  if (tag === 'BR') {
    return <br key={key} />;
  }
  if (tag === 'HR') {
    return <hr key={key} />;
  }
  if (tag === 'A') {
    const href = safeHref(el.getAttribute('href'));
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return React.createElement(tag.toLowerCase(), { key }, children);
}

/** Turn structured mail HTML into React nodes — no innerHTML. */
export function structuredMailNodes(html: string): React.ReactNode {
  if (typeof window === 'undefined') {
    return null;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.childNodes).map((child, index) =>
    mapNode(child, index)
  );
}
