'use client'

import ChatInput from './ChatInput'
import MessageArea from './MessageArea'
import ChatHeader from './ChatHeader'

const ChatArea = () => {
  return (
    <main className="relative m-1.5 flex flex-grow flex-col rounded-xl bg-background">
      <ChatHeader />
      <MessageArea />
      <div className="sticky bottom-0 ml-9 px-4 pb-2">
        <ChatInput />
      </div>
    </main>
  )
}

export default ChatArea
