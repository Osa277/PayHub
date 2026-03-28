/**
 * Frontend hook for tracking API calls, form submissions, and component state
 * Logs all data collection points in the browser
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { dataTracker } from './logger';

/**
 * Hook retained for compatibility.
 * Global fetch monkeypatching was removed because it interferes with auth flows.
 */
export function useApiLogger() {
  useEffect(() => {
    return () => undefined
  }, [])
}

/**
 * Hook to track form submissions
 * Usage: 
 *   const trackForm = useFormTracker();
 *   const handleSubmit = (data) => {
 *     trackForm('SignupForm', data);
 *     // submit...
 *   }
 */
export function useFormTracker() {
  const { data: session } = useSession();

  return useCallback(
    (formName: string, formData: Record<string, any>) => {
      dataTracker.trackFormSubmission(formName, formData, session?.user?.id);
    },
    [session?.user?.id]
  );
}

/**
 * Hook to track state changes (for debugging complex state)
 * Usage:
 *   const [loading, setLoading] = useStateLogger('loading', initialValue, 'PaymentForm');
 */
export function useStateLogger<T>(
  key: string,
  initialValue: T,
  componentName: string
): [T, (value: T) => void] {
  const { data: session } = useSession();
  const [value, setValue] = useState<T>(initialValue);
  const previousValue = useRef<T>(initialValue);

  const setValueWithTracking = useCallback(
    (newValue: T) => {
      if (previousValue.current !== newValue) {
        dataTracker.trackStateChange(
          componentName,
          key,
          previousValue.current,
          newValue,
          session?.user?.id
        );
        previousValue.current = newValue;
      }
      setValue(newValue);
    },
    [key, componentName, session?.user?.id]
  );

  return [value, setValueWithTracking];
}

/**
 * Hook to track authentication events
 * Usage:
 *   const trackAuth = useAuthTracker();
 *   trackAuth('login_success', { provider: 'credentials' });
 */
export function useAuthTracker() {
  const { data: session } = useSession();

  return useCallback(
    (event: string, details?: Record<string, any>) => {
      if (session?.user?.id) {
        dataTracker.trackAuthEvent(event, session.user.id, details);
      }
    },
    [session?.user?.id]
  );
}

/**
 * Hook to track financial transactions
 * Usage:
 *   const trackTxn = useTransactionTracker();
 *   trackTxn('payment', { amount: 100, currency: 'USD', status: 'completed' });
 */
export function useTransactionTracker() {
  const { data: session } = useSession();

  return useCallback(
    (
      type: 'payment' | 'transfer' | 'topup',
      details: {
        amount: number;
        currency: string;
        recipient?: string;
        status: 'initiated' | 'completed' | 'failed';
        transactionId?: string;
        error?: string;
      }
    ) => {
      if (session?.user?.id) {
        dataTracker.trackTransaction(type, session.user.id, details);
      }
    },
    [session?.user?.id]
  );
}
