"use client"

import { useState, useRef, useCallback } from "react"
import {
  IconPhoto,
  IconVideo,
  IconPlayerPlay,
  IconUpload,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconCopy,
  IconCheck,
  IconCurrencyDollar,
  IconApi,
  IconRobot,
} from "@tabler/icons-react"
import {
  SYNVOW_MODEL_CONFIG,
  SYNVOW_IMAGE_MODELS,
  SYNVOW_VIDEO_MODELS,
} from "@/services/ai-providers/synvow"
import type { SynvowModelType } from "@/services/ai-providers/synvow"

// ─── Kling native API models ───────────────────────────────────────────────────

type KlingModelId = "avatar-voice" | "avatar-generate" | "kling-lip-sync"

const KLING_MODEL_CONFIG: Record<KlingModelId, { label: string; description: string }> = {
  "avatar-voice": {
    label: "Avatar Voice",
    description: "Face image + preset voice ID → lip-synced video",
  },
  "avatar-generate": {
    label: "Avatar Generate",
    description: "Face image + audio file URL → lip-synced video",
  },
  "kling-lip-sync": {
    label: "Kling Lip Sync",
    description: "Video URL + text → lip-synced video",
  },
}

const KLING_MODEL_IDS: KlingModelId[] = ["avatar-voice", "avatar-generate", "kling-lip-sync"]

// ─── Task state ───────────────────────────────────────────────────────────────

type TaskStatus = "idle" | "submitting" | "polling" | "done" | "error"
type OutputTab = "result" | "api"

interface TaskResult {
  taskId: string
  modelId: string
  type: SynvowModelType
  status: TaskStatus
  output: string | null
  error: string | null
  elapsedMs: number
  requestPayload: Record<string, unknown> | null
  rawResponse: unknown | null
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap bg-[rgb(255_255_255_/_0.04)] border border-[rgb(255_255_255_/_0.04)] p-0.5 rounded-lg gap-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all whitespace-nowrap ${
            value === o
              ? "bg-white/[0.09] text-[#FFFF00] shadow-sm"
              : "text-gray-500 hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/** Upload a File to Bunny CDN via the inftester upload endpoint. Returns CDN URL. */
async function uploadToCdn(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/inftester/upload-input", { method: "POST", body: fd })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) throw new Error(data.error ?? "CDN upload failed")
  return data.url
}

interface ImageSlotState {
  /** Local blob URL for preview */
  preview: string | null
  /** Bunny CDN URL — set after successful upload */
  cdnUrl: string | null
  uploading: boolean
  uploadError: string | null
}

function ImageUploadSlot({
  label,
  state,
  onReady,
  onClear,
}: {
  label: string
  state: ImageSlotState
  onReady: (cdnUrl: string, preview: string) => void
  onClear: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [localUploading, setLocalUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleFile(file: File) {
    const preview = URL.createObjectURL(file)
    setLocalUploading(true)
    setLocalError(null)
    try {
      const cdnUrl = await uploadToCdn(file)
      onReady(cdnUrl, preview)
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setLocalUploading(false)
    }
  }

  const busy = localUploading || state.uploading

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">{label}</span>
      {state.preview || busy ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
          {state.preview && (
            <img src={state.preview} alt="" className="w-full h-full object-cover" />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <IconLoader2 size={16} className="animate-spin text-white" />
            </div>
          )}
          {state.cdnUrl && !busy && (
            <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/70 text-[8px] text-[#FFFF00]/80 truncate font-mono">
              ✓ CDN
            </div>
          )}
          {!busy && (
            <button
              onClick={onClear}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <IconX size={10} />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-24 h-24 rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5 text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
        >
          <IconUpload size={16} />
          <span className="text-[10px]">Upload</span>
        </button>
      )}
      {localError && (
        <span className="text-[10px] text-red-400">{localError}</span>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}

/** JSON viewer — scrollable, preserves formatting */
function JsonView({ data }: { data: unknown }) {
  const sanitised = JSON.parse(
    JSON.stringify(data, (_key, value: unknown) => {
      if (typeof value === "string" && value.length > 300 && /^[A-Za-z0-9+/=]+$/.test(value)) {
        return `[base64 ~${Math.round(value.length / 1024)}KB redacted]`
      }
      return value
    })
  ) as unknown

  return (
    <div className="inf-scroll overflow-auto max-h-[360px] rounded">
      <pre className="text-[11px] text-white/70 font-mono leading-relaxed whitespace-pre min-w-0">
        {JSON.stringify(sanitised, null, 2)}
      </pre>
    </div>
  )
}

function OutputPanel({ result }: { result: TaskResult }) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<OutputTab>("result")
  const modelDef = SYNVOW_MODEL_CONFIG[result.modelId]

  function copyUrl() {
    if (result.output) {
      void navigator.clipboard.writeText(result.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const elapsed = (result.elapsedMs / 1000).toFixed(1)
  const isSync = result.taskId.startsWith("sync_")
  const hasApiData = result.requestPayload || result.rawResponse

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          {result.status === "polling" || result.status === "submitting" ? (
            <IconLoader2 size={14} className="text-[#FFFF00] animate-spin" />
          ) : result.status === "error" ? (
            <IconAlertCircle size={14} className="text-red-400" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#FFFF00]" />
          )}
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">
            {result.status === "submitting"
              ? "Submitting…"
              : result.status === "polling"
              ? `Generating… ${elapsed}s`
              : result.status === "done"
              ? `Done · ${elapsed}s`
              : result.status === "error"
              ? "Error"
              : ""}
          </span>
          {modelDef && (
            <span className="text-[10px] text-white/25 font-medium">{modelDef.label}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Cost estimate — labelled as approximate */}
          {modelDef?.costUsd !== undefined && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
              <IconCurrencyDollar size={10} className="text-[#FFFF00]/70" />
              <span className="text-[10px] text-[#FFFF00]/70 font-mono font-semibold">
                ~${modelDef.costUsd.toFixed(2)} est.
              </span>
            </div>
          )}
          {!result.taskId.startsWith("temp-") && (
            <span className="text-[10px] text-white/20 font-mono truncate max-w-[120px]">
              {isSync ? "sync" : result.taskId}
            </span>
          )}
        </div>
      </div>

      {/* Tabs — only shown once we have data */}
      {(result.status === "done" || result.status === "error" || hasApiData) && (
        <div className="flex border-b border-white/[0.05] px-4 gap-0">
          <button
            onClick={() => setActiveTab("result")}
            className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
              activeTab === "result"
                ? "border-[#FFFF00] text-[#FFFF00]"
                : "border-transparent text-white/30 hover:text-white/60"
            }`}
          >
            Result
          </button>
          {hasApiData && (
            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                activeTab === "api"
                  ? "border-[#FFFF00] text-[#FFFF00]"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}
            >
              <IconApi size={11} />
              API
            </button>
          )}
        </div>
      )}

      <div className="p-4">
        {/* ── Result tab ─────────────────────────────────────────────────────── */}
        {activeTab === "result" && (
          <div className="flex flex-col gap-3">
            {/* Loading */}
            {(result.status === "submitting" || result.status === "polling") && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <IconLoader2 size={28} className="text-[#FFFF00] animate-spin" />
                <span className="text-sm text-white/40">
                  {result.status === "submitting" ? "Submitting task…" : "Waiting for result…"}
                </span>
              </div>
            )}

            {/* Error */}
            {result.status === "error" && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                {result.error}
              </div>
            )}

            {/* Output */}
            {result.status === "done" && result.output && (
              <>
                {result.type === "image" ? (
                  <img
                    src={result.output}
                    alt="Generated"
                    className="w-full rounded-lg"
                    style={{ animation: "fadeIn 0.4s ease-out" }}
                  />
                ) : (
                  <video
                    src={result.output}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg"
                    style={{ animation: "fadeIn 0.4s ease-out" }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <a
                    href={result.output}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-[11px] text-white/30 font-mono hover:text-white/60 transition-colors"
                  >
                    {result.output}
                  </a>
                  <button
                    onClick={copyUrl}
                    className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
                  >
                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── API tab ─────────────────────────────────────────────────────────── */}
        {activeTab === "api" && (
          <div className="flex flex-col gap-4">
            {result.requestPayload && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">→ Request</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <div className="rounded-lg bg-black/30 border border-white/[0.06] px-3 py-2.5">
                  <JsonView data={result.requestPayload} />
                </div>
              </div>
            )}
            {result.rawResponse && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">← Response</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <div className="rounded-lg bg-black/30 border border-white/[0.06] px-3 py-2.5">
                  <JsonView data={result.rawResponse} />
                </div>
              </div>
            )}
            {!result.requestPayload && !result.rawResponse && (
              <p className="text-sm text-white/30 text-center py-6">No API data yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty slot helper ────────────────────────────────────────────────────────

function emptySlot(): ImageSlotState {
  return { preview: null, cdnUrl: null, uploading: false, uploadError: null }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InftesterPage() {
  // Synvow state
  const [selectedModel, setSelectedModel] = useState("nano-banana-2")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [duration, setDuration] = useState("10")
  const [audioSync, setAudioSync] = useState(false)
  const [refImage, setRefImage] = useState<ImageSlotState>(emptySlot())
  const [firstFrame, setFirstFrame] = useState<ImageSlotState>(emptySlot())

  // Kling state
  const [klingModel, setKlingModel] = useState<KlingModelId | null>(null)
  const [faceImage, setFaceImage] = useState<ImageSlotState>(emptySlot())
  const [audioId, setAudioId] = useState("")
  const [soundFile, setSoundFile] = useState("")
  const [klingPrompt, setKlingPrompt] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [klingText, setKlingText] = useState("")
  const [voiceId, setVoiceId] = useState("girlfriend_1_speech02")
  const [voiceLanguage, setVoiceLanguage] = useState<"zh" | "en">("en")

  const [results, setResults] = useState<TaskResult[]>([])
  const [busy, setBusy] = useState(false)

  const modelDef = SYNVOW_MODEL_CONFIG[selectedModel]!
  const controls = modelDef.controls

  const updateResult = useCallback((taskId: string, patch: Partial<TaskResult>) => {
    setResults((prev) => prev.map((r) => (r.taskId === taskId ? { ...r, ...patch } : r)))
  }, [])

  async function handleGenerate() {
    if (busy || !prompt.trim()) return
    // Don't generate if image is still uploading
    if (refImage.uploading || firstFrame.uploading) return

    setBusy(true)
    const startMs = Date.now()
    const tempId = `temp-${startMs}`

    setResults((prev) => [
      {
        taskId: tempId,
        modelId: selectedModel,
        type: modelDef.type,
        status: "submitting",
        output: null,
        error: null,
        elapsedMs: 0,
        requestPayload: null,
        rawResponse: null,
      },
      ...prev,
    ])

    const ticker = setInterval(() => {
      setResults((prev) =>
        prev.map((r) =>
          r.status === "submitting" || r.status === "polling"
            ? { ...r, elapsedMs: Date.now() - startMs }
            : r
        )
      )
    }, 1000)

    try {
      const payload: Record<string, unknown> = {
        model: selectedModel,
        prompt: prompt.trim(),
      }

      if (controls.aspectRatios) payload.aspect_ratio = aspectRatio
      if (controls.durations) payload.duration = parseInt(duration, 10)
      if (controls.audioSync) payload.audio_sync = audioSync

      // Pass CDN URL to the API (preferred) — falls back to no image if not uploaded
      if (controls.referenceImage && refImage.cdnUrl) {
        payload.images = [{ type: "url", data: refImage.cdnUrl }]
      }
      if (controls.strictReference && refImage.cdnUrl) {
        payload.reference_image = refImage.cdnUrl
      }
      if (controls.firstFrameImage && firstFrame.cdnUrl) {
        payload.first_frame = firstFrame.cdnUrl
      }

      const genRes = await fetch("/api/inftester/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const genData = (await genRes.json()) as {
        taskId?: string
        type?: SynvowModelType
        immediateOutput?: string | null
        requestPayload?: Record<string, unknown>
        error?: string
      }

      if (!genRes.ok || !genData.taskId) {
        updateResult(tempId, {
          status: "error",
          error: genData.error ?? "Failed to submit task",
          elapsedMs: Date.now() - startMs,
          requestPayload: payload,
          rawResponse: genData,
        })
        return
      }

      const realTaskId = genData.taskId
      const type = genData.type ?? modelDef.type

      // Image models return URL immediately — no polling
      if (genData.immediateOutput) {
        setResults((prev) =>
          prev.map((r) =>
            r.taskId === tempId
              ? {
                  ...r,
                  taskId: realTaskId,
                  type,
                  status: "done",
                  output: genData.immediateOutput!,
                  elapsedMs: Date.now() - startMs,
                  requestPayload: payload,
                  rawResponse: genData,
                }
              : r
          )
        )
        return
      }

      // Video: start polling
      setResults((prev) =>
        prev.map((r) =>
          r.taskId === tempId
            ? { ...r, taskId: realTaskId, type, status: "polling", requestPayload: payload, rawResponse: genData }
            : r
        )
      )

      const POLL_INTERVAL = 3000
      const MAX_ATTEMPTS = 120

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await sleep(POLL_INTERVAL)

        const pollRes = await fetch(`/api/inftester/poll?taskId=${realTaskId}&type=${type}`)
        const pollData = (await pollRes.json()) as {
          status?: string
          output?: string
          error?: string
          raw?: unknown
        }

        if (!pollRes.ok) {
          updateResult(realTaskId, {
            status: "error",
            error: pollData.error ?? "Polling error",
            elapsedMs: Date.now() - startMs,
            rawResponse: pollData,
          })
          break
        }

        const apiStatus = (pollData.status ?? "").toUpperCase()

        if (apiStatus === "SUCCESS" || apiStatus === "COMPLETED") {
          updateResult(realTaskId, {
            status: "done",
            output: typeof pollData.output === "string" && pollData.output ? pollData.output : null,
            elapsedMs: Date.now() - startMs,
            rawResponse: pollData.raw ?? pollData,
          })
          break
        }

        if (["FAILURE", "FAILED", "ERROR"].includes(apiStatus)) {
          updateResult(realTaskId, {
            status: "error",
            error: "Generation failed",
            elapsedMs: Date.now() - startMs,
            rawResponse: pollData.raw ?? pollData,
          })
          break
        }

        // Still in progress — update elapsed + latest response (only on terminal state for videos)
        updateResult(realTaskId, { elapsedMs: Date.now() - startMs })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setResults((prev) =>
        prev.map((r) =>
          r.taskId === tempId
            ? { ...r, status: "error", error: message, elapsedMs: Date.now() - startMs }
            : r
        )
      )
    } finally {
      clearInterval(ticker)
      setBusy(false)
    }
  }

  async function handleKlingGenerate() {
    if (busy || klingModel === null) return

    setBusy(true)
    const startMs = Date.now()
    const tempId = `temp-${startMs}`

    setResults((prev) => [
      {
        taskId: tempId,
        modelId: klingModel,
        type: "video" as SynvowModelType,
        status: "submitting",
        output: null,
        error: null,
        elapsedMs: 0,
        requestPayload: null,
        rawResponse: null,
      },
      ...prev,
    ])

    const ticker = setInterval(() => {
      setResults((prev) =>
        prev.map((r) =>
          r.status === "submitting" || r.status === "polling"
            ? { ...r, elapsedMs: Date.now() - startMs }
            : r
        )
      )
    }, 1000)

    try {
      const payload: Record<string, unknown> = { klingModel }

      if (klingModel === "avatar-voice") {
        payload.image = faceImage.cdnUrl
        payload.audio_id = audioId
        if (klingPrompt.trim()) payload.prompt = klingPrompt.trim()
      } else if (klingModel === "avatar-generate") {
        payload.image = faceImage.cdnUrl
        payload.sound_file = soundFile
        if (klingPrompt.trim()) payload.prompt = klingPrompt.trim()
      } else {
        // kling-lip-sync
        payload.video_url = videoUrl
        payload.text = klingText
        payload.voice_id = voiceId
        payload.voice_language = voiceLanguage
      }

      const genRes = await fetch("/api/inftester/kling/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const genData = (await genRes.json()) as {
        taskId?: string
        klingModel?: string
        requestPayload?: Record<string, unknown>
        _debugResponse?: unknown
        error?: string
      }

      if (!genRes.ok || !genData.taskId) {
        updateResult(tempId, {
          status: "error",
          error: genData.error ?? "Failed to submit Kling task",
          elapsedMs: Date.now() - startMs,
          requestPayload: payload,
          rawResponse: genData,
        })
        return
      }

      const realTaskId = genData.taskId

      setResults((prev) =>
        prev.map((r) =>
          r.taskId === tempId
            ? {
                ...r,
                taskId: realTaskId,
                status: "polling",
                requestPayload: payload,
                rawResponse: genData._debugResponse ?? genData,
              }
            : r
        )
      )

      const POLL_INTERVAL = 3000
      const MAX_ATTEMPTS = 120

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await sleep(POLL_INTERVAL)

        const pollRes = await fetch(
          `/api/inftester/kling/poll?taskId=${realTaskId}&klingModel=${klingModel}`
        )
        const pollData = (await pollRes.json()) as {
          status?: string
          output?: string
          error?: string
          raw?: unknown
        }

        if (!pollRes.ok) {
          updateResult(realTaskId, {
            status: "error",
            error: pollData.error ?? "Kling polling error",
            elapsedMs: Date.now() - startMs,
            rawResponse: pollData,
          })
          break
        }

        const apiStatus = (pollData.status ?? "").toUpperCase()

        if (apiStatus === "SUCCESS") {
          updateResult(realTaskId, {
            status: "done",
            output: typeof pollData.output === "string" && pollData.output ? pollData.output : null,
            elapsedMs: Date.now() - startMs,
            rawResponse: pollData.raw ?? pollData,
          })
          break
        }

        if (["FAILURE", "FAILED", "ERROR"].includes(apiStatus)) {
          updateResult(realTaskId, {
            status: "error",
            error: "Kling generation failed",
            elapsedMs: Date.now() - startMs,
            rawResponse: pollData.raw ?? pollData,
          })
          break
        }

        updateResult(realTaskId, { elapsedMs: Date.now() - startMs })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setResults((prev) =>
        prev.map((r) =>
          r.taskId === tempId
            ? { ...r, status: "error", error: message, elapsedMs: Date.now() - startMs }
            : r
        )
      )
    } finally {
      clearInterval(ticker)
      setBusy(false)
    }
  }

  const canKlingGenerate =
    !busy &&
    klingModel !== null &&
    !faceImage.uploading &&
    (() => {
      if (klingModel === "avatar-voice") return !!faceImage.cdnUrl && !!audioId.trim()
      if (klingModel === "avatar-generate") return !!faceImage.cdnUrl && !!soundFile.trim()
      if (klingModel === "kling-lip-sync") return !!videoUrl.trim() && !!klingText.trim()
      return false
    })()

  const canGenerate =
    klingModel !== null
      ? canKlingGenerate
      : !busy && prompt.trim().length > 0 && !refImage.uploading && !firstFrame.uploading

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .inf-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .inf-scroll::-webkit-scrollbar-track { background: transparent; }
        .inf-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .inf-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
      `}</style>

      <div className="min-h-screen bg-[#0A0A0A] text-white pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Inference Tester</h1>
            <p className="text-sm text-white/40">Test Synvow AI models — image &amp; video generation</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

            {/* Left: controls */}
            <div className="flex flex-col gap-4">

              {/* Model selector */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-4">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Model</span>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IconPhoto size={12} className="text-white/30" />
                    <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">Image</span>
                  </div>
                  {SYNVOW_IMAGE_MODELS.map((id) => {
                    const m = SYNVOW_MODEL_CONFIG[id]!
                    return (
                      <button
                        key={id}
                        onClick={() => { setSelectedModel(id); setKlingModel(null) }}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                          klingModel === null && selectedModel === id
                            ? "bg-white/[0.07] border border-[#FFFF00]/30 text-white"
                            : "border border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">{m.label}</div>
                          <div className="text-[11px] text-white/30 mt-0.5">{m.description}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {m.costUsd !== undefined && (
                            <span className="text-[10px] text-white/25 font-mono">~${m.costUsd.toFixed(2)}</span>
                          )}
                          {klingModel === null && selectedModel === id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IconVideo size={12} className="text-white/30" />
                    <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">Video</span>
                  </div>
                  {SYNVOW_VIDEO_MODELS.map((id) => {
                    const m = SYNVOW_MODEL_CONFIG[id]!
                    return (
                      <button
                        key={id}
                        onClick={() => { setSelectedModel(id); setKlingModel(null) }}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                          klingModel === null && selectedModel === id
                            ? "bg-white/[0.07] border border-[#FFFF00]/30 text-white"
                            : "border border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">{m.label}</div>
                          <div className="text-[11px] text-white/30 mt-0.5">{m.description}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {m.costUsd !== undefined && (
                            <span className="text-[10px] text-white/25 font-mono">~${m.costUsd.toFixed(2)}</span>
                          )}
                          {klingModel === null && selectedModel === id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="h-px bg-white/[0.05]" />

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IconRobot size={12} className="text-white/30" />
                    <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">Kling Native API</span>
                  </div>
                  {KLING_MODEL_IDS.map((id) => {
                    const m = KLING_MODEL_CONFIG[id]
                    return (
                      <button
                        key={id}
                        onClick={() => setKlingModel(id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                          klingModel === id
                            ? "bg-white/[0.07] border border-[#FFFF00]/30 text-white"
                            : "border border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">{m.label}</div>
                          <div className="text-[11px] text-white/30 mt-0.5">{m.description}</div>
                        </div>
                        {klingModel === id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] shrink-0 ml-2" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Parameters */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-4">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Parameters</span>

                {klingModel !== null ? (
                  /* ── Kling native API parameters ── */
                  <>
                    {(klingModel === "avatar-voice" || klingModel === "avatar-generate") && (
                      <>
                        <ImageUploadSlot
                          label="Face Image (required)"
                          state={faceImage}
                          onReady={(cdnUrl, preview) =>
                            setFaceImage({ preview, cdnUrl, uploading: false, uploadError: null })
                          }
                          onClear={() => setFaceImage(emptySlot())}
                        />

                        {klingModel === "avatar-voice" && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Voice Preset ID</span>
                            <input
                              value={audioId}
                              onChange={(e) => setAudioId(e.target.value)}
                              placeholder="e.g. girlfriend_1_speech02"
                              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        )}

                        {klingModel === "avatar-generate" && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Audio File URL</span>
                            <input
                              value={soundFile}
                              onChange={(e) => setSoundFile(e.target.value)}
                              placeholder="https://…/audio.mp3"
                              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Prompt (optional)</span>
                          <textarea
                            value={klingPrompt}
                            onChange={(e) => setKlingPrompt(e.target.value)}
                            placeholder="Optional description…"
                            rows={2}
                            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
                          />
                        </div>
                      </>
                    )}

                    {klingModel === "kling-lip-sync" && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Video URL</span>
                          <input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://…/video.mp4"
                            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Text to Speak</span>
                          <textarea
                            value={klingText}
                            onChange={(e) => setKlingText(e.target.value)}
                            placeholder="What should the person say…"
                            rows={3}
                            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Voice ID</span>
                          <input
                            value={voiceId}
                            onChange={(e) => setVoiceId(e.target.value)}
                            placeholder="e.g. girlfriend_1_speech02"
                            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Voice Language</span>
                          <PillGroup
                            options={["en", "zh"]}
                            value={voiceLanguage}
                            onChange={(v) => setVoiceLanguage(v as "zh" | "en")}
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => void handleKlingGenerate()}
                      disabled={!canGenerate}
                      className="w-full h-14 rounded-xl bg-[#FFFF00] text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFFF00]/90 active:scale-[0.99] transition-all"
                    >
                      {busy ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          Generating…
                        </>
                      ) : faceImage.uploading ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          Uploading image…
                        </>
                      ) : (
                        <>
                          <IconPlayerPlay size={16} />
                          Generate (Kling)
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* ── Synvow parameters ── */
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Prompt</span>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you want to generate…"
                        rows={4}
                        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>

                    {controls.aspectRatios && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Aspect Ratio</span>
                        <PillGroup options={controls.aspectRatios} value={aspectRatio} onChange={setAspectRatio} />
                      </div>
                    )}

                    {controls.durations && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Duration (s)</span>
                        <PillGroup options={controls.durations} value={duration} onChange={setDuration} />
                      </div>
                    )}

                    {controls.audioSync && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">Audio Sync</span>
                        <button
                          onClick={() => setAudioSync((v) => !v)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${audioSync ? "bg-[#FFFF00]/80" : "bg-white/10"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${audioSync ? "left-5" : "left-0.5"}`} />
                        </button>
                      </div>
                    )}

                    {(controls.referenceImage || controls.strictReference) && (
                      <ImageUploadSlot
                        label={controls.strictReference ? "Reference Image (strict)" : "Reference Image (optional)"}
                        state={refImage}
                        onReady={(cdnUrl, preview) =>
                          setRefImage({ preview, cdnUrl, uploading: false, uploadError: null })
                        }
                        onClear={() => setRefImage(emptySlot())}
                      />
                    )}

                    {controls.firstFrameImage && (
                      <ImageUploadSlot
                        label="First Frame (optional)"
                        state={firstFrame}
                        onReady={(cdnUrl, preview) =>
                          setFirstFrame({ preview, cdnUrl, uploading: false, uploadError: null })
                        }
                        onClear={() => setFirstFrame(emptySlot())}
                      />
                    )}

                    {/* Cost notice */}
                    {modelDef.costUsd !== undefined && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFFF00]/[0.04] border border-[#FFFF00]/[0.08]">
                        <IconCurrencyDollar size={13} className="text-[#FFFF00]/60 shrink-0" />
                        <span className="text-[11px] text-[#FFFF00]/60">
                          Estimated cost:{" "}
                          <span className="font-bold text-[#FFFF00]/80">~${modelDef.costUsd.toFixed(2)}</span>
                          <span className="text-white/25 ml-1">(verify on provider site)</span>
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => void handleGenerate()}
                      disabled={!canGenerate}
                      className="w-full h-14 rounded-xl bg-[#FFFF00] text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFFF00]/90 active:scale-[0.99] transition-all"
                    >
                      {busy ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          Generating…
                        </>
                      ) : refImage.uploading || firstFrame.uploading ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          Uploading image…
                        </>
                      ) : (
                        <>
                          <IconPlayerPlay size={16} />
                          Generate
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right: results */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] lg:overflow-y-auto px-4 pt-2 pb-4">
              {results.length === 0 ? (
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] flex flex-col items-center justify-center py-24 gap-3 text-white/20">
                  <IconPlayerPlay size={32} strokeWidth={1} />
                  <span className="text-sm">Results will appear here</span>
                </div>
              ) : (
                results.map((r) => <OutputPanel key={r.taskId} result={r} />)
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
