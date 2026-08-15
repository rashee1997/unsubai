'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  return (
    <div className={`markdown-body prose prose-indigo dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-800 dark:text-zinc-200">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1 my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1 my-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2 mb-1">{children}</h3>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName && codeClassName.includes('language-');
            if (isBlock) {
              return (
                <code className="block p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto my-2 border border-slate-800">
                  {children}
                </code>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-medium border border-slate-300/50 dark:border-zinc-700/50">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-500 pl-3 py-1 my-2 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-700 dark:text-zinc-300 rounded-r-md text-xs italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-500 transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-100 dark:bg-zinc-800 p-2 font-bold border-b border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2 border-b border-slate-100 dark:border-zinc-800/60 text-slate-800 dark:text-zinc-300">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
