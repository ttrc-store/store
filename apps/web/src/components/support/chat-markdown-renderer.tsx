'use client';

import * as React from 'react';

interface ChatMarkdownRendererProps {
  content: string;
}

/**
 * Parses inline markdown:
 * - **bold**
 * - *italic*
 * - `code`
 * - [link](url)
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match bold, italic, code, link
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }

    const tokenStr = match[0];

    if (tokenStr.startsWith('**') && tokenStr.endsWith('**')) {
      // Bold
      const inner = tokenStr.slice(2, -2);
      tokens.push(
        <strong key={`bold-${match.index}`} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    } else if (tokenStr.startsWith('*') && tokenStr.endsWith('*')) {
      // Italic
      const inner = tokenStr.slice(1, -1);
      tokens.push(
        <em key={`italic-${match.index}`} className="italic">
          {inner}
        </em>
      );
    } else if (tokenStr.startsWith('`') && tokenStr.endsWith('`')) {
      // Code
      const inner = tokenStr.slice(1, -1);
      tokens.push(
        <code
          key={`code-${match.index}`}
          className="px-1 py-0.5 rounded bg-purple-50 font-mono text-[11px] text-[#844AFB]"
        >
          {inner}
        </code>
      );
    } else if (tokenStr.startsWith('[') && tokenStr.includes('](')) {
      // Link
      const linkMatch = tokenStr.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkHref = linkMatch[2];
        tokens.push(
          <a
            key={`link-${match.index}`}
            href={linkHref}
            target={linkHref.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="text-[#844AFB] hover:underline font-semibold"
          >
            {linkText}
          </a>
        );
      } else {
        tokens.push(tokenStr);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : [text];
}

/**
 * Parses block markdown including:
 * - Tables (| Header | Header | \n |---|---| \n | cell | cell |)
 * - Headings (### Title)
 * - Bullet Lists (- item)
 * - Paragraphs
 */
export function ChatMarkdownRenderer({ content }: ChatMarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Table Detection (Line starts with | and next line has |---|)
    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('-')
    ) {
      const headerCells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      i += 2; // skip header and separator row

      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const rowCells = lines[i]
          .trim()
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        rows.push(rowCells);
        i++;
      }

      elements.push(
        <div key={`table-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-purple-100 shadow-2xs">
          <table className="w-full text-left text-[11px] border-collapse bg-white">
            <thead className="bg-purple-50/60 border-b border-purple-100">
              <tr>
                {headerCells.map((h, hIdx) => (
                  <th key={hIdx} className="px-2.5 py-1.5 font-bold text-slate-900">
                    {renderInlineFormatting(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1.5 text-slate-700 align-top">
                      {renderInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 2. Heading 1-4 (### / ## / #)
    if (trimmed.startsWith('#')) {
      const levelMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (levelMatch) {
        const text = levelMatch[2];
        elements.push(
          <h4 key={`heading-${i}`} className="font-bold text-slate-900 text-xs mt-2.5 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#844AFB] inline-block" />
            {renderInlineFormatting(text)}
          </h4>
        );
        i++;
        continue;
      }
    }

    // 3. Bullet List item (- or * )
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`list-${i}`} className="my-1.5 space-y-1 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-slate-700">
              <span className="text-[#844AFB] mt-0.5 text-[10px] leading-tight">•</span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 4. Numbered List item (1. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1.5 space-y-1 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-slate-700">
              <span className="font-bold text-[#844AFB] text-[10px] min-w-[14px]">{idx + 1}.</span>
              <span className="flex-1">{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 5. Empty line (Paragraph break)
    if (trimmed.length === 0) {
      i++;
      continue;
    }

    // 6. Regular Paragraph Line
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-slate-800 my-1">
        {renderInlineFormatting(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 text-xs">{elements}</div>;
}
