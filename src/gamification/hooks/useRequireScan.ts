import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScanStore } from '../../store/scanStore'

export function useRequireScan() {
  const navigate = useNavigate()
  const hasScans = useScanStore((s) => s.scans.length > 0)
  useEffect(() => {
    if (!hasScans) navigate('/scan', { replace: true })
  }, [hasScans, navigate])
  return hasScans
}
