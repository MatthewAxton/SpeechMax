import { useState, useEffect, useRef, useCallback } from 'react'

type MicState = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export function useMicrophone() {
  const [state, setState] = useState<MicState>('idle')
  const streamRef = useRef<MediaStream | null>(null)

  const requestMic = useCallback(async () => {
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      setState('active')
      return stream
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setState('denied')
      } else {
        setState('error')
      }
      return null
    }
  }, [])

  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setState('idle')
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  return {
    micState: state,
    stream: streamRef.current,
    requestMic,
    stopMic,
  }
}
