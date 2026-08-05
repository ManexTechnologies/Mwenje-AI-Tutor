'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, type AppUser } from '@/lib/auth'
import { loadUserProfile, type LearningProfile } from '@/lib/profile'

type ProfileContextValue = {
  user: AppUser | null
  authReady: boolean
  profile: LearningProfile | null
  loadingProfile: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function fallbackForUser(user: AppUser): LearningProfile {
  return {
    name: user.name || 'Learner',
    email: user.email || '',
    school: '',
    grade: '',
    curriculum: 'ZIMSEC',
    subjects: ['Mathematics', 'English Language'],
    learningGoals: ['Improve exam performance'],
    preferredLearningStyle: 'step-by-step examples',
    weakAreas: [],
    examinationYear: null
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

const applyUser = useCallback((nextUser: AppUser | null) => {
    setUser(nextUser)
    setAuthReady(true)
    setProfile(nextUser ? fallbackForUser(nextUser) : null)
    setProfileError(null)
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      const nextUser = await getCurrentUser()
      applyUser(nextUser)
    } catch (err) {
      applyUser(null)
    }
  }, [applyUser])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoadingProfile(false)
      setProfileError(null)
      return
    }

    const fallback = fallbackForUser(user)
    setProfile((current) => current || fallback)
    setLoadingProfile(true)
    setProfileError(null)

    try {
      setProfile(await loadUserProfile(fallback, 3500))
    } catch (err) {
      setProfile(fallback)
      setProfileError(err instanceof Error ? err.message : 'Could not load your profile. Showing account defaults.')
    } finally {
      setLoadingProfile(false)
    }
  }, [user])

useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then((nextUser) => {
        if (cancelled) return
        applyUser(nextUser)
      })
      .catch((err) => {
        if (cancelled) return
        applyUser(null)
        setLoadingProfile(false)
        setProfileError(err instanceof Error ? err.message : 'Could not check your sign-in status.')
      })

    return () => {
      cancelled = true
    }
  }, [applyUser])

  useEffect(() => {
    if (!authReady) return
    void refreshProfile()
  }, [authReady, refreshProfile])

const value = useMemo(
    () => ({ user, authReady, profile, loadingProfile, profileError, refreshProfile, refreshAuth }),
    [user, authReady, profile, loadingProfile, profileError, refreshProfile, refreshAuth]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider')
  }

  return context
}
