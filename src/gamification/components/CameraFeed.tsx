import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

interface CameraFeedProps {
  overlay?: React.ReactNode
  mirror?: boolean
  borderRadius?: number
  style?: React.CSSProperties
  /** Also request microphone access (for screens that need both) */
  withAudio?: boolean
  /** Callback with the MediaStream when camera is ready */
  onStream?: (stream: MediaStream) => void
}

export function CameraFeed({ overlay, mirror = true, borderRadius = 20, style, withAudio = false, onStream }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<CameraState>('idle')

  async function requestCamera() {
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: withAudio,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setState('active')
      if (onStream) onStream(stream)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setState('denied')
      } else {
        setState('error')
      }
    }
  }

  // Auto-request on mount
  useEffect(() => {
    requestCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const containerStyle: React.CSSProperties = {
    width: '100%', maxWidth: 640, height: 260,
    borderRadius, position: 'relative', overflow: 'hidden',
    border: '2px solid var(--purple, #c28fe7)',
    background: '#000',
    ...style,
  }

  // Active — live video
  if (state === 'active') {
    return (
      <div style={containerStyle}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: mirror ? 'scaleX(-1)' : undefined,
          }}
        />
        {overlay && <div style={{ position: 'absolute', inset: 0 }}>{overlay}</div>}
      </div>
    )
  }

  // Placeholder states
  const placeholderStyle: React.CSSProperties = {
    ...containerStyle,
    background: 'white',
    border: '2px dashed var(--purple, #c28fe7)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    color: 'var(--purple, #c28fe7)',
  }

  if (state === 'idle' || state === 'requesting') {
    return (
      <div style={placeholderStyle}>
        <Camera size={44} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted, #777)' }}>
          {state === 'requesting' ? 'Requesting camera access...' : 'Enable camera to start'}
        </span>
        {state === 'idle' && (
          <button
            onClick={requestCamera}
            style={{
              background: 'var(--purple, #c28fe7)', color: 'white', border: 'none',
              padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Allow Camera
          </button>
        )}
      </div>
    )
  }

  // Denied or error
  return (
    <div style={placeholderStyle}>
      <Camera size={44} style={{ opacity: 0.5 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted, #777)', textAlign: 'center', maxWidth: 320 }}>
        {state === 'denied'
          ? 'Camera permission denied. Please allow access in your browser settings.'
          : 'Could not access camera. Please check your device.'}
      </span>
      <button
        onClick={requestCamera}
        style={{
          background: 'var(--purple, #c28fe7)', color: 'white', border: 'none',
          padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  )
}
