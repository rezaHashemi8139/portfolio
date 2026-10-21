import { Fragment, type ReactNode } from 'react';

/**
 * Tiny inline markup so editors can style text from the admin without HTML:
 *   **bold**  → <b>      *accent*  → <em>
 * Everything else is rendered as plain text, so content can never inject markup.
 */
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function Rich({ text }: { text: string }): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <b key={i}>{part.slice(2, -2)}</b>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** The same text with the markers stripped — for <title>, meta tags and JSON-LD. */
export const plain = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
