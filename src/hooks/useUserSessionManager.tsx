import { useEffect } from 'react'
import { usePlaygroundStore } from '@/store'
import { getCurrentUser } from '@/lib/auth'
import { useQueryState } from 'nuqs'

/**
 * Hook per gestire il cambio di utente e pulire i dati della sessione precedente
 * Assicura che i messaggi vengano sempre puliti quando cambia l'utente
 */
const useUserSessionManager = () => {
  const { 
    currentUserId, 
    setCurrentUserId, 
    setMessages, 
    setSessionsData 
  } = usePlaygroundStore()
  const [, setSessionId] = useQueryState('session')

  // Inizializza l'utente corrente al primo caricamento
  useEffect(() => {
    if (currentUserId === null) {
      const { userId } = getCurrentUser()
      console.log('Initializing current user:', userId)
      setCurrentUserId(userId)
    }
  }, [currentUserId, setCurrentUserId])

  useEffect(() => {
    const { userId } = getCurrentUser()
    
    // Se l'utente è cambiato (incluso login/logout)
    if (currentUserId !== userId) {
      console.log('User changed from', currentUserId, 'to', userId, '- clearing session data')
      
      // Pulisci sempre i messaggi quando cambia l'utente
      setMessages([])
      
      // Pulisci l'ID sessione dall'URL
      setSessionId(null)
      
      // Pulisci i dati delle sessioni
      setSessionsData(() => null)
      
      // Aggiorna l'ID utente corrente
      setCurrentUserId(userId)
    }
  }, [currentUserId, setCurrentUserId, setMessages, setSessionId, setSessionsData])

  // Effetto per monitorare i cambiamenti di autenticazione
  useEffect(() => {
    const handleAuthChange = () => {
      const { userId } = getCurrentUser()
      
      if (currentUserId !== userId) {
        console.log('Auth change detected - user changed from', currentUserId, 'to', userId)
        
        // Pulisci sempre i dati quando cambia l'autenticazione
        setMessages([])
        setSessionId(null)
        setSessionsData(() => null)
        setCurrentUserId(userId)
      }
    }

    // Ascolta gli eventi di autenticazione
    window.addEventListener('authStateChanged', handleAuthChange)
    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('focus', handleAuthChange)

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('focus', handleAuthChange)
    }
  }, [currentUserId, setCurrentUserId, setMessages, setSessionId, setSessionsData])
}

export default useUserSessionManager
