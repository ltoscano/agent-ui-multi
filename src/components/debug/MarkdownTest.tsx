'use client'

import { useState, useEffect } from 'react'
import MarkdownRenderer from '@/components/ui/typography/MarkdownRenderer/MarkdownRenderer'
import StreamingMarkdownRenderer from '@/components/ui/typography/MarkdownRenderer/StreamingMarkdownRenderer'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { AgentMessage } from '@/components/playground/ChatArea/Messages/MessageItem'

const MarkdownTest = () => {
  const [content, setContent] = useState('')
  const [testRunning, setTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<'parentheses' | 'brackets'>('parentheses')
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])

  const testMessages = {
    parentheses: [
      'The sum of ',
      '(',
      '123',
      ' + ',
      '34',
      ')',
      ' equals ',
      '157',
      '.'
    ],
    brackets: [
      'The array is ',
      '[',
      '1',
      ', ',
      '2',
      ', ',
      '3',
      ']',
      ' with length 3.'
    ]
  }

    const runTest = async () => {
    setTestRunning(true)
    setContent('')
    setMessages([])
    
    // Aggiungi messaggio iniziale vuoto (come fa la chat reale)
    setMessages([{ role: 'agent', content: '' }])
    
    let accumulated = ''
    const messageChunks = testMessages[currentTest]
    for (const chunk of messageChunks) {
      accumulated += chunk
      setContent(accumulated)
      
      // Simula il comportamento della chat reale aggiornando l'ultimo messaggio
      setMessages(prevMessages => {
        const newMessages = [...prevMessages]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === 'agent') {
          lastMessage.content = accumulated
        }
        return newMessages
      })
      
      console.log('Setting content:', accumulated)
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
    }
    
    setTestRunning(false)
  }

  const runChatSimulationTest = async () => {
    setTestRunning(true)
    setMessages([])
    
    // Simula esattamente il comportamento di useAIStreamHandler
    setMessages([{ role: 'agent', content: '' }])
    
    let lastContent = ''
    const messageChunks = testMessages[currentTest]
    
    for (const chunk of messageChunks) {
      setMessages(prevMessages => {
        const newMessages = [...prevMessages]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === 'agent') {
          // Simula la logica di useAIStreamHandler - SENZA mutare l'oggetto originale
          const updatedMessage = {
            ...lastMessage,
            content: lastMessage.content + chunk
          }
          newMessages[newMessages.length - 1] = updatedMessage
          lastContent = updatedMessage.content
        }
        return newMessages
      })
      
      console.log('Chat simulation - accumulated:', lastContent)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setTestRunning(false)
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg max-w-4xl">
      <h3 className="text-lg font-bold mb-4">Markdown Streaming Test</h3>
      
      <div className="mb-4 flex gap-4 items-center">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="parentheses"
            checked={currentTest === 'parentheses'}
            onChange={(e) => setCurrentTest(e.target.value as 'parentheses' | 'brackets')}
          />
          Test Parentesi ( )
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="brackets"
            checked={currentTest === 'brackets'}
            onChange={(e) => setCurrentTest(e.target.value as 'parentheses' | 'brackets')}
          />
          Test Parentesi Quadre [ ]
        </label>
      </div>
      
      <div className="mb-4 flex gap-4 items-center">
        <button 
          onClick={runTest} 
          disabled={testRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {testRunning ? 'Running Test...' : 'Start Simple Test'}
        </button>
        
        <button 
          onClick={runChatSimulationTest} 
          disabled={testRunning}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          {testRunning ? 'Running Test...' : 'Start Chat Simulation'}
        </button>
      </div>
      
      <div className="mb-4">
        <strong>Raw Content (Simple Test):</strong>
        <pre className="bg-gray-100 p-2 rounded text-sm">{content}</pre>
      </div>
      
      <div className="mb-4">
        <strong>Chat Simulation Messages:</strong>
        <div className="bg-gray-50 p-2 rounded">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <strong>{msg.role}:</strong> 
              <pre className="bg-white p-1 rounded text-sm inline-block ml-2">{msg.content}</pre>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong>Rendered with MarkdownRenderer (full plugins):</strong>
          <div className="border border-gray-200 p-2 rounded">
            <MarkdownRenderer>{content}</MarkdownRenderer>
          </div>
        </div>
        
        <div>
          <strong>Rendered with ReactMarkdown only:</strong>
          <div className="border border-gray-200 p-2 rounded">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        
        <div>
          <strong>Rendered with remarkGfm only:</strong>
          <div className="border border-gray-200 p-2 rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
        
        <div>
          <strong>Rendered with rehypeRaw + rehypeSanitize:</strong>
          <div className="border border-gray-200 p-2 rounded">
            <ReactMarkdown 
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        
        <div>
          <strong>Real AgentMessage Component:</strong>
          <div className="border border-gray-200 p-2 rounded">
            {messages.length > 0 && (
              <AgentMessage 
                message={{
                  role: 'agent',
                  content: messages[messages.length - 1].content,
                  created_at: Date.now(),
                  tool_calls: [],
                  streamingError: false
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkdownTest
