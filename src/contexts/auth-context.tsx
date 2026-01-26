'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient, getCurrentUser, signOut as authSignOut } from '@/lib/supabase-auth';
import { identifyUser, resetUser, trackEvent } from '@/lib/posthog';
import { tracking } from '@/lib/tracking';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial user
        getCurrentUser().then((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Listen for auth changes
        const supabase = createClient();
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);

            // Track auth events in PostHog and unified tracking
            if (event === 'SIGNED_IN' && session?.user) {
                const method = session.user.app_metadata.provider || 'email';

                // Fetch user traits from API (includes person_id)
                fetch('/api/user/traits', { credentials: 'include' })
                    .then(res => res.json())
                    .then(traits => {
                        // Identify user in PostHog with person_id (canonical identity)
                        // This stitches PostHog anonymous ID to our Person record
                        const personId = traits.person_id || session.user.id;
                        identifyUser(personId, {
                            email: session.user.email,
                            user_id: session.user.id, // Keep Supabase user ID as a trait
                            ...traits,
                        });
                        tracking.identify(personId, {
                            email: session.user.email,
                            user_id: session.user.id,
                            ...traits,
                        });
                    })
                    .catch(err => {
                        console.error('Failed to fetch user traits:', err);
                        // Fall back to basic identification with user ID
                        identifyUser(session.user.id, {
                            email: session.user.email,
                        });
                        tracking.identify(session.user.id, {
                            email: session.user.email,
                        });
                    });

                // Track login success
                trackEvent('user_logged_in', { method });
                tracking.trackLoginSuccess({ method });
            } else if (event === 'SIGNED_OUT') {
                trackEvent('user_logged_out');
                resetUser();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        // Track logout event before signing out
        trackEvent('user_logged_out');
        resetUser();

        await authSignOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
