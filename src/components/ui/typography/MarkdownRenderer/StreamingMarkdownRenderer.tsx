'use client'

import { type FC, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

import { type MarkdownRendererProps } from './types'
import { inlineComponents } from './inlineStyles'
import { components } from './styles'

/**
 * StreamingMarkdownRenderer - Una versione ottimizzata per lo streaming
 * che gestisce meglio il contenuto parziale e i caratteri speciali
 */
const StreamingMarkdownRenderer: FC<MarkdownRendererProps> = ({
  children,
  classname,
  inline = false
}) => {
  // Sanitizza il contenuto per lo streaming - evita problemi con sintassi markdown incompleta
  const sanitizedContent = useMemo(() => {
    if (!children) return ''
    
    // Controlla se il contenuto sembra essere incompleto o problematico per il markdown
    const hasUnmatchedParentheses = (text: string) => {
      let openParens = 0
      let openBrackets = 0
      
      for (const char of text) {
        if (char === '(') openParens++
        else if (char === ')') openParens--
        else if (char === '[') openBrackets++
        else if (char === ']') openBrackets--
      }
      
      return openParens !== 0 || openBrackets !== 0
    }
    
    const hasIncompleteMarkdownSyntax = (text: string) => {
      // Controlla per sintassi markdown potenzialmente incompleta
      const patterns = [
        /\*[^*]*$/, // Asterisco non chiuso alla fine
        /_[^_]*$/, // Underscore non chiuso alla fine
        /`[^`]*$/, // Backtick non chiuso alla fine
        /\[[^\]]*$/, // Parentesi quadra aperta non chiusa alla fine
        /!\[[^\]]*$/, // Link immagine incompleto alla fine
      ]
      
      return patterns.some(pattern => pattern.test(text))
    }
    
    // Se il contenuto ha sintassi incompleta, usa rendering semplificato
    if (hasUnmatchedParentheses(children) || hasIncompleteMarkdownSyntax(children)) {
      return children
    }
    
    return children
  }, [children])
  
  // Decide se usare rendering completo o semplificato
  const shouldUseSimpleRendering = useMemo(() => {
    if (!children) return false
    
    // Controlla se abbiamo parentesi o sintassi potenzialmente problematiche
    const problemPatterns = [
      /\([^)]*$/, // Parentesi aperta non chiusa
      /\[[^\]]*$/, // Parentesi quadra aperta non chiusa
      /\*[^*]*$/, // Asterisco non chiuso
      /_[^_]*$/, // Underscore non chiuso
      /`[^`]*$/, // Backtick non chiuso
    ]
    
    return problemPatterns.some(pattern => pattern.test(children))
  }, [children])

  // Se il contenuto è problematico, usa rendering semplice senza plugin
  if (shouldUseSimpleRendering) {
    return (
      <div className={cn(
        'prose prose-h1:text-xl dark:prose-invert flex w-full flex-col gap-y-5 rounded-lg',
        classname
      )}>
        <pre className="whitespace-pre-wrap font-sans text-sm text-primary">
          {children}
        </pre>
      </div>
    )
  }

  // Altrimenti usa il rendering markdown completo
  return (
    <ReactMarkdown
      className={cn(
        'prose prose-h1:text-xl dark:prose-invert flex w-full flex-col gap-y-5 rounded-lg',
        classname
      )}
      components={{ ...(inline ? inlineComponents : components) }}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
    >
      {sanitizedContent}
    </ReactMarkdown>
  )
}

export default StreamingMarkdownRenderer
