'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import SessionItem from './SessionItem'
import SessionBlankState from './SessionBlankState'
import useSessionLoader from '@/hooks/useSessionLoader'
import useUserSessionManager from '@/hooks/useUserSessionManager'

import { cn } from '@/lib/utils'
import { FC } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentUser } from '@/lib/auth'

interface SkeletonListProps {
  skeletonCount: number
}

const SkeletonList: FC<SkeletonListProps> = ({ skeletonCount }) => {
  const skeletons = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount]
  )

  return skeletons.map((skeleton, index) => (
    <Skeleton
      key={skeleton}
      className={cn(
        'mb-1 h-11 rounded-lg px-3 py-2',
        index > 0 && 'bg-background-secondary'
      )}
    />
  ))
}

dayjs.extend(utc)

const formatDate = (
  timestamp: number,
  format: 'natural' | 'full' = 'full'
): string => {
  const date = dayjs.unix(timestamp).utc()
  return format === 'natural'
    ? date.format('HH:mm')
    : date.format('YYYY-MM-DD HH:mm:ss')
}

const Sessions = () => {
  const [agentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [sessionId, setSessionId] = useQueryState('session')
  const {
    selectedEndpoint,
    isEndpointActive,
    isEndpointLoading,
    sessionsData,
    hydrated,
    hasStorage,
    setSessionsData,
    currentUserId
  } = usePlaygroundStore()
  const [isScrolling, setIsScrolling] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )
  const { getSession, getSessions } = useSessionLoader()
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const { isSessionsLoading } = usePlaygroundStore()
  
  // Gestisce automaticamente la pulizia dei messaggi quando cambia l'utente
  useUserSessionManager()
  
  const handleScroll = () => {
    setIsScrolling(true)

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }

  // Cleanup the scroll timeout when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Load a session on render if a session id exists in url
  useEffect(() => {
    if (sessionId && agentId && selectedEndpoint && hydrated) {
      // Verify the session belongs to current user before loading
      const { userId } = getCurrentUser()
      if (userId) {
        // If sessionsData is available, check if session exists in user's sessions
        if (sessionsData) {
          const sessionExists = sessionsData.find(session => session.session_id === sessionId)
          if (!sessionExists) {
            console.warn('Session not found in user sessions, clearing URL parameter:', sessionId)
            setSessionId(null)
            return
          }
        }
        // If sessionsData is not yet loaded, we'll let getSession handle the auth check
        getSession(sessionId, agentId)
      } else {
        // No user logged in, clear the session
        setSessionId(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, sessionId, agentId, selectedEndpoint, sessionsData])

  useEffect(() => {
    if (!selectedEndpoint || !agentId || !hasStorage) {
      setSessionsData(() => null)
      return
    }
    if (!isEndpointLoading) {
      // Add a small delay to ensure auth cookies are available
      setTimeout(() => {
        const { userId } = getCurrentUser()
        console.log('Loading sessions with userId:', userId)
        setSessionsData(() => null)
        getSessions(agentId)
      }, 100)
    }
  }, [
    selectedEndpoint,
    agentId,
    getSessions,
    isEndpointLoading,
    hasStorage,
    setSessionsData
  ])

  useEffect(() => {
    if (sessionId) {
      setSelectedSessionId(sessionId)
    }
  }, [sessionId])

  // Ricarica le sessioni quando cambia l'utente
  useEffect(() => {
    if (currentUserId && selectedEndpoint && agentId && hasStorage && !isEndpointLoading) {
      console.log('User changed, reloading sessions for userId:', currentUserId)
      setSessionsData(() => null)
      getSessions(agentId)
    }
  }, [currentUserId, selectedEndpoint, agentId, hasStorage, isEndpointLoading, getSessions, setSessionsData])



  const formattedSessionsData = useMemo(() => {
    if (!sessionsData || !Array.isArray(sessionsData)) return []

    return sessionsData.map((entry) => ({
      ...entry,
      created_at: entry.created_at,
      formatted_time: formatDate(entry.created_at, 'natural')
    }))
  }, [sessionsData])

  const handleSessionClick = useCallback(
    (id: string) => () => setSelectedSessionId(id),
    []
  )



  if (isSessionsLoading || isEndpointLoading)
    return (
      <div className="w-full">
        <div className="mb-2 text-xs font-medium uppercase">Sessions</div>
        <div className="mt-4 h-[calc(100vh-325px)] w-full overflow-y-auto">
          <SkeletonList skeletonCount={5} />
        </div>
      </div>
    )
  return (
    <div className="w-full">
      <div className="mb-2 w-full text-xs font-medium uppercase">Sessions</div>
      <div
        className={`h-[calc(100vh-345px)] overflow-y-auto font-geist transition-all duration-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:transition-opacity [&::-webkit-scrollbar]:duration-300 ${isScrolling ? '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-background [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:opacity-0' : '[&::-webkit-scrollbar]:opacity-100'}`}
        onScroll={handleScroll}
        onMouseOver={() => setIsScrolling(true)}
        onMouseLeave={handleScroll}
      >
        {!isEndpointActive ||
        !hasStorage ||
        (!isSessionsLoading && (!sessionsData || sessionsData.length === 0)) ? (
          <SessionBlankState />
        ) : (
          <div className="flex flex-col gap-y-1 pr-1">
            {formattedSessionsData.map((entry, index) => (
              <SessionItem
                key={`${entry.session_id}-${index}`}
                {...entry}
                isSelected={selectedSessionId === entry.session_id}
                onSessionClick={handleSessionClick(entry.session_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sessions
