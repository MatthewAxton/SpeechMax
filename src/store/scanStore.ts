import { create } from 'zustand'
import type { ScanResult, ScanRawData, RadarScores } from '../analysis/types'
import { computeRadarScores } from '../analysis/scoring/radarScorer'

interface ScanState {
  scans: ScanResult[]
  currentScanId: string | null
  isScanning: boolean
  rawDataBuffer: Partial<ScanRawData>

  startScan: () => void
  appendRawData: (data: Partial<ScanRawData>) => void
  completeScan: () => void
  getLatestScores: () => RadarScores | null
  getPreviousScores: () => RadarScores | null
}

export const useScanStore = create<ScanState>((set, get) => ({
  scans: [],
  currentScanId: null,
  isScanning: false,
  rawDataBuffer: {},

  startScan: () => {
    const id = `scan_${Date.now()}`
    set({
      currentScanId: id,
      isScanning: true,
      rawDataBuffer: {
        durationSeconds: 0,
        fillerCount: 0,
        wordCount: 0,
        eyeContactPercent: 0,
        postureScore: 0,
        avgWpm: 0,
        wpmStdDev: 0,
        pitchStdDev: 0,
        stillnessPercent: 0,
        fidgetCount: 0,
      },
    })
  },

  appendRawData: (data) => {
    set((s) => ({
      rawDataBuffer: { ...s.rawDataBuffer, ...data },
    }))
  },

  completeScan: () => {
    const { currentScanId, rawDataBuffer } = get()
    if (!currentScanId) return

    const raw: ScanRawData = {
      durationSeconds: rawDataBuffer.durationSeconds ?? 30,
      fillerCount: rawDataBuffer.fillerCount ?? 0,
      wordCount: rawDataBuffer.wordCount ?? 0,
      eyeContactPercent: rawDataBuffer.eyeContactPercent ?? 0,
      postureScore: rawDataBuffer.postureScore ?? 0,
      avgWpm: rawDataBuffer.avgWpm ?? 0,
      wpmStdDev: rawDataBuffer.wpmStdDev ?? 0,
      pitchStdDev: rawDataBuffer.pitchStdDev ?? 0,
      stillnessPercent: rawDataBuffer.stillnessPercent ?? 0,
      fidgetCount: rawDataBuffer.fidgetCount ?? 0,
    }

    const scores = computeRadarScores(raw)

    const result: ScanResult = {
      id: currentScanId,
      scores,
      rawData: raw,
      timestamp: Date.now(),
    }

    set((s) => ({
      scans: [...s.scans, result],
      currentScanId: null,
      isScanning: false,
      rawDataBuffer: {},
    }))
  },

  getLatestScores: () => {
    const { scans } = get()
    return scans.length > 0 ? scans[scans.length - 1].scores : null
  },

  getPreviousScores: () => {
    const { scans } = get()
    return scans.length > 1 ? scans[scans.length - 2].scores : null
  },
}))
