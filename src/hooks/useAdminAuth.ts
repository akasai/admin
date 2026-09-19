import { useEffect, useState } from 'react'
import { getAdminApiKey, getAdminApiKeyEventName, setAdminApiKey, clearAdminApiKey } from '../lib/apiClient'

export function useAdminAuth() {
    const [apiKey, setApiKeyState] = useState<string>(() => getAdminApiKey())

    useEffect(() => {
        const eventName = getAdminApiKeyEventName()
        function syncApiKey() {
            setApiKeyState(getAdminApiKey())
        }
        window.addEventListener(eventName, syncApiKey)
        return () => window.removeEventListener(eventName, syncApiKey)
    }, [])

    function login(key: string) {
        setAdminApiKey(key)
        setApiKeyState(key)
    }

    function logout() {
        clearAdminApiKey()
        setApiKeyState('')
    }

    return {
        apiKey,
        isAuthenticated: apiKey.length > 0,
        login,
        logout,
    }
}
