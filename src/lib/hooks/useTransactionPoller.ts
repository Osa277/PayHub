'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger'

interface TransactionStatus {
  id: string
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
  blockchainHash?: string
}

interface UseTransactionPollerOptions {
  transactionIds: string[]
  enabled?: boolean
  onStatusUpdate?: (transaction: TransactionStatus) => void
}

const PENDING_INTERVAL = 5000
const IDLE_INTERVAL = 30000
const INACTIVITY_TIMEOUT = 3600000

/**
 * Custom hook for polling transaction status
 * Checks pending transactions frequently, older ones less frequently
 */
export function useTransactionPoller({
  transactionIds,
  enabled = true,
  onStatusUpdate,
}: UseTransactionPollerOptions) {
  const [statuses, setStatuses] = useState<Map<string, TransactionStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const onStatusUpdateRef = useRef(onStatusUpdate)
  const statusesRef = useRef(statuses)

  // Keep refs in sync
  onStatusUpdateRef.current = onStatusUpdate
  statusesRef.current = statuses

  // Fetch status for a single transaction
  const fetchTransactionStatus = useCallback(async (transactionId: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/crypto/transaction-status?id=${encodeURIComponent(transactionId)}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const status: TransactionStatus = {
        id: transactionId,
        status: data.data.status,
        confirmations: data.data.confirmations || 0,
        blockchainHash: data.data.blockchainHash,
      }

      return status
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null
      logger.error('Failed to fetch transaction status', {
        context: {
          transactionId,
          error: (err as Error).message,
        },
      })
      return null
    }
  }, [])

  // Only poll transactions that are still pending
  const getPendingIds = useCallback((): string[] => {
    const current = statusesRef.current
    return transactionIds.filter((id) => {
      const known = current.get(id)
      return !known || known.status === 'pending'
    })
  }, [transactionIds])

  // Poll pending transactions
  const pollTransactions = useCallback(async (signal?: AbortSignal) => {
    const idsToPoll = getPendingIds()
    if (idsToPoll.length === 0 && statusesRef.current.size > 0) return

    // On first poll, fetch all; thereafter only pending
    const fetchIds = statusesRef.current.size === 0 ? transactionIds : idsToPoll
    if (fetchIds.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const updates = await Promise.all(
        fetchIds.map((id) => fetchTransactionStatus(id, signal))
      )

      if (signal?.aborted) return

      setStatuses((prev) => {
        const next = new Map(prev)
        updates.forEach((status) => {
          if (status) {
            next.set(status.id, status)
            onStatusUpdateRef.current?.(status)
          }
        })
        return next
      })
      lastActivityRef.current = Date.now()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [transactionIds, fetchTransactionStatus, getPendingIds])

  // Determine polling interval based on transaction status
  const getPollingInterval = useCallback((): number => {
    const hasPending = Array.from(statusesRef.current.values()).some(
      (s) => s.status === 'pending'
    )
    return hasPending ? PENDING_INTERVAL : IDLE_INTERVAL
  }, [])

  // Schedule next poll with adaptive interval
  const scheduleNextPoll = useCallback((signal?: AbortSignal) => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }

    const inactiveTime = Date.now() - lastActivityRef.current
    if (inactiveTime > INACTIVITY_TIMEOUT) return

    pollTimeoutRef.current = setTimeout(async () => {
      if (signal?.aborted) return
      await pollTransactions(signal)
      scheduleNextPoll(signal)
    }, getPollingInterval())
  }, [pollTransactions, getPollingInterval])

  // Setup polling effect
  useEffect(() => {
    if (!enabled || transactionIds.length === 0) {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
      return
    }

    const abortController = new AbortController()

    // Initial poll then schedule
    pollTransactions(abortController.signal).then(() => {
      scheduleNextPoll(abortController.signal)
    })

    // Resume polling on page focus
    const handleFocus = () => {
      lastActivityRef.current = Date.now()
      pollTransactions(abortController.signal).then(() => {
        scheduleNextPoll(abortController.signal)
      })
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      abortController.abort()
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, transactionIds, pollTransactions, scheduleNextPoll])

  return {
    statuses,
    isLoading,
    error,
    refetch: pollTransactions,
  }
}
