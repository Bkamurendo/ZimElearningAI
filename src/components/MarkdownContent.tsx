'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { ComponentProps } from 'react'

interface Props {
  content: string
  className?: string
}

type TableCellProps = ComponentProps<'th'> | ComponentProps<'td'>

// Detect if a <code> node is inside a <pre> block (i.e., a fenced code block).
// In react-markdown v10 the `inline` prop is gone; we check the hast node parent instead.
function isInlineCode(node: unknown): boolean {
  const n = node as { parent?: { tagName?: string } } | undefined
  return n?.parent?.tagName !== 'pre'
}

export default function MarkdownContent({ content, className = '' }: Props) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // ── Headings ──────────────────────────────────────────────────────────
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b-2 border-emerald-200 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-gray-800 mt-5 mb-3 pb-1.5 border-b border-gray-200 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-gray-800 mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-gray-700 mt-3 mb-1.5">{children}</h4>
          ),

          // ── Paragraphs ────────────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="text-sm text-gray-700 leading-relaxed mb-3 last:mb-0">{children}</p>
          ),

          // ── Lists — ul uses custom emerald bullets; ol uses decimal numbers ──
          ul: ({ children }) => (
            <ul className="space-y-1.5 mb-3 pl-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-6 space-y-1.5 mb-3 text-sm text-gray-700">{children}</ol>
          ),
          li: ({ children, node }) => {
            // Detect if this li is inside an ordered list
            const inOrderedList = (node as { parent?: { tagName?: string } })?.parent?.tagName === 'ol'
            if (inOrderedList) {
              return (
                <li className="text-sm text-gray-700 leading-relaxed pl-1">{children}</li>
              )
            }
            return (
              <li className="text-sm text-gray-700 leading-relaxed flex gap-2 items-start">
                <span className="text-emerald-500 mt-1 flex-shrink-0 text-base leading-none">•</span>
                <span className="flex-1">{children}</span>
              </li>
            )
          },

          // ── Inline emphasis ───────────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">{children}</em>
          ),

          // ── Code ─────────────────────────────────────────────────────────────
          // In react-markdown v10 the `inline` prop is removed.
          // We detect inline vs block via the hast node parent (pre = block).
          code: ({ children, node, ...props }: ComponentProps<'code'> & { node?: unknown }) =>
            isInlineCode(node) ? (
              <code className="bg-gray-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-gray-900 text-green-300 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed" {...props}>
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="my-3 rounded-xl overflow-hidden">{children}</pre>
          ),

          // ── Blockquote — used for exam tips, notes, warnings ─────────────────
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-400 bg-amber-50 pl-4 pr-3 py-3 my-3 rounded-r-xl text-sm text-amber-900">
              {children}
            </blockquote>
          ),

          // ── Horizontal rule ───────────────────────────────────────────────────
          hr: () => (
            <hr className="my-5 border-t-2 border-gray-100" />
          ),

          // ── Tables — GFM, fully styled ────────────────────────────────────────
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-emerald-600 text-white">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-gray-50 hover:bg-emerald-50/40 transition-colors">{children}</tr>
          ),
          th: ({ children, ...props }: TableCellProps) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap" {...props as ComponentProps<'th'>}>{children}</th>
          ),
          td: ({ children, ...props }: TableCellProps) => (
            <td className="px-4 py-2.5 text-gray-700 text-xs" {...props as ComponentProps<'td'>}>{children}</td>
          ),

          // ── Links ─────────────────────────────────────────────────────────────
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2 text-sm">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
