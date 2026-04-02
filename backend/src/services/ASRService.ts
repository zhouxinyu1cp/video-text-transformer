import type { TranscriptSegment } from '@video-transcriber/shared'
import { nodewhisper } from 'nodejs-whisper'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

/**
 * nodejs-whisper Service
 * Uses the nodejs-whisper npm package for local speech recognition
 * Based on whisper.cpp, runs entirely offline with no API fees
 *
 * Package: https://www.npmjs.com/package/nodejs-whisper
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get the output JSON file path for a given audio file
// nodejs-whisper may convert to WAV first, so check for both .json and .wav.json
function getOutputJsonPath(audioPath: string): string {
  const parsed = path.parse(audioPath)
  // Check for .wav.json first (created when nodejs-whisper converts to WAV)
  const wavJsonPath = path.join(parsed.dir, `${parsed.name}.wav.json`)
  if (fs.existsSync(wavJsonPath)) {
    return wavJsonPath
  }
  // Fall back to direct .json path
  return path.join(parsed.dir, `${parsed.name}.json`)
}

interface WhisperJsonResult {
  text?: string
  timestamps?: {
    from: string
    to: string
  }
  transcription?: WhisperJsonSegment[]  // nodejs-whisper uses 'transcription' array
  segments?: WhisperJsonSegment[]        // fallback
}

interface WhisperJsonSegment {
  text: string
  timestamps: {
    from: string
    to: string
  }
  offsets?: {
    from: number
    to: number
  }
}

class WhisperNodeJSService {
  private modelName: string

  constructor() {
    this.modelName = 'base' // Use base model for balanced speed/accuracy
  }

  /**
   * Transcribe audio file using nodejs-whisper (whisper.cpp base model)
   * @param audioPath - Path to audio file (mp3, wav, etc.)
   * @returns Array of transcript segments with timestamps
   */
  async transcribe(audioPath: string): Promise<TranscriptSegment[]> {
    try {
      console.log(`[ASR] Starting transcription: ${audioPath}`)

      // nodejs-whisper writes output to files based on options
      // Use outputInJsonFull to get detailed JSON with timestamps
      await nodewhisper(audioPath, {
        modelName: this.modelName,
        autoDownloadModelName: this.modelName, // Auto-download model if not present
        removeWavFileAfterTranscription: true, // Clean up temp WAV file
        whisperOptions: {
          outputInJsonFull: true, // Output full JSON with timestamps
          splitOnWord: true,       // Split on word boundaries
        },
      })

      // Read the output JSON file
      const outputJsonPath = getOutputJsonPath(audioPath)
      if (!fs.existsSync(outputJsonPath)) {
        throw new Error(`Output JSON file not found: ${outputJsonPath}`)
      }

      const jsonContent = fs.readFileSync(outputJsonPath, 'utf-8')
      const result = JSON.parse(jsonContent) as WhisperJsonResult

      const segments = result.transcription || result.segments
      console.log(`[ASR] Transcription complete, ${segments?.length ?? 0} segments`)
      console.log(`[ASR] JSON keys: ${Object.keys(result).join(', ')}`)
      if (result.transcription) {
        console.log(`[ASR] Using 'transcription' array`)
      } else if (result.segments) {
        console.log(`[ASR] Using 'segments' array`)
      }

      // Clean up the output JSON file
      fs.unlinkSync(outputJsonPath)

      return this.convertToSegments(result)
    } catch (error) {
      console.error('[ASR] nodejs-whisper transcription failed:', error)
      throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  private convertToSegments(result: WhisperJsonResult): TranscriptSegment[] {
    // Use transcription array if available, fallback to segments
    const segments = result.transcription || result.segments
    if (!segments || segments.length === 0) {
      return []
    }

    return segments.map((seg, idx) => {
      // Prefer offsets (milliseconds) if available, otherwise parse timestamps
      let startMs: number
      let endMs: number

      if (seg.offsets?.from !== undefined && seg.offsets?.to !== undefined) {
        startMs = seg.offsets.from
        endMs = seg.offsets.to
      } else {
        // Parse timestamp strings like "00:00:00,000" (comma-separated ms)
        const fromSec = this.parseTimestamp(seg.timestamps?.from ?? '0')
        const toSec = this.parseTimestamp(seg.timestamps?.to ?? '0')
        startMs = Math.round(fromSec * 1000)
        endMs = Math.round(toSec * 1000)
      }

      return {
        id: `seg_${String(idx + 1).padStart(3, '0')}`,
        startTime: startMs,
        endTime: endMs,
        text: seg.text.trim(),
        speakerId: 'spk_001', // placeholder, separateSpeakers() will refine this
        confidence: 0.9,      // nodejs-whisper doesn't expose per-segment confidence in base API
      }
    })
  }

  private parseTimestamp(timestamp: string): number {
    // Handle formats like "00:00:00.000" or "00:00:00,000" (both comma and dot separated ms)
    const normalized = timestamp.replace(',', '.')
    const parts = normalized.split(':')
    if (parts.length === 3) {
      // HH:MM:SS.mmm format
      const [hours, minutes, seconds] = parts
      return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds)
    } else if (parts.length === 2) {
      // MM:SS.mmm format
      const [minutes, seconds] = parts
      return parseFloat(minutes) * 60 + parseFloat(seconds)
    }
    return parseFloat(normalized) || 0
  }
}

class ASRService {
  private whisperService: WhisperNodeJSService

  constructor() {
    this.whisperService = new WhisperNodeJSService()
  }

  async transcribe(audioPath: string): Promise<TranscriptSegment[]> {
    try {
      const segments = await this.whisperService.transcribe(audioPath)
      return segments
    } catch (error) {
      console.error('ASR transcription failed:', error)
      throw error
    }
  }

  separateSpeakers(segments: TranscriptSegment[]): TranscriptSegment[] {
    // Speaker separation based on pause detection
    // whisper.cpp base model does not include built-in speaker diarization,
    // so we rely on inter-segment pauses (> 2s) to infer speaker changes
    const PAUSE_THRESHOLD = 2000 // milliseconds
    const merged: TranscriptSegment[] = []
    let current: TranscriptSegment | null = null
    let speakerCounter = 0

    for (const seg of segments) {
      if (!current) {
        // First segment
        current = { ...seg, speakerId: 'spk_001' }
        continue
      }

      const pause = seg.startTime - current.endTime
      const hasLongPause = pause > PAUSE_THRESHOLD
      const speakerChanged = current.speakerId !== seg.speakerId

      if (speakerChanged) {
        // Different speaker → always switch
        speakerCounter++
        merged.push(current)
        current = {
          ...seg,
          id: `seg_${String(merged.length + 1).padStart(3, '0')}`,
          speakerId: `spk_${String(speakerCounter + 1).padStart(3, '0')}`,
        }
      } else if (hasLongPause) {
        // Same speaker but long pause → new speaker group
        speakerCounter++
        merged.push(current)
        current = {
          ...seg,
          id: `seg_${String(merged.length + 1).padStart(3, '0')}`,
          speakerId: `spk_${String(speakerCounter + 1).padStart(3, '0')}`,
        }
      } else {
        // Same speaker, short/no pause → merge
        current.endTime = seg.endTime
        current.text += seg.text
      }
    }

    if (current) merged.push(current)

    return merged
  }
}

export const asrService = new ASRService()
export { WhisperNodeJSService }

