# Phase 3: Voice & Image Sharing - Research

**Researched:** 2026-07-25
**Domain:** Media recording, storage, and playback in React PWA
**Confidence:** HIGH

## Summary

Phase 3 adds voice messages and image sharing to the existing chat system, plus a shared photo album on the homepage. The core technical challenge is threefold: (1) voice recording with live waveform visualization using browser-native APIs, (2) image compression and inline display, and (3) Supabase Storage integration for persisting media files with proper RLS policies.

The existing codebase (React 19 + Zustand + Supabase + Motion) provides a solid foundation. The chat system from Phase 2 uses a message schema that needs extension (add `message_type` and `media_url` columns). No external libraries are strictly required — the MediaRecorder API, Web Audio API, and Canvas API are all browser-native and sufficient for this use case. A lightweight `react-audio-visualize` package is recommended for waveform display to avoid reinventing canvas rendering.

**Primary recommendation:** Use browser-native APIs (MediaRecorder, Web Audio, Canvas) for all recording and compression. Add `react-audio-visualize` (0 deps, 1.2.0) for waveform display in chat. Create two Supabase Storage buckets (`chat-media` and `album-photos`) with pair-scoped RLS policies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hold-to-record (WhatsApp-style): hold mic button, release to send, slide left to cancel
- **D-02:** Live waveform visualization during recording (real-time audio visualization)
- **D-03:** Recording UI replaces the input bar during recording (clean transition)
- **D-04:** Cancel gesture: slide left while holding (visual feedback shows cancel zone)
- **D-05:** Store voice files in Supabase Storage bucket (integrates with existing auth/RLS)
- **D-06:** Format: WebM/Opus (modern, small file size, supported by MediaRecorder API)
- **D-07:** Max duration: 5 minutes (reasonable limit, prevents abuse)
- **D-08:** Client-side processing only (no FastAPI endpoint needed for audio)
- **D-09:** Inline thumbnails in chat bubbles (tap to view full-screen)
- **D-10:** Client-side compression before upload (reduces storage costs, faster uploads)
- **D-11:** Single image per message (matches WhatsApp default behavior)
- **D-12:** Gallery picker for image selection (standard mobile pattern)
- **D-13:** Album lives in two places: mini horizontal scrollable section on homepage (HOME-04) + dedicated album page accessible from drawer
- **D-14:** Direct upload to album from album page (separate from chat image sharing)
- **D-15:** Photos organized chronologically by upload date (simple, familiar pattern)
- **D-16:** No capacity limit (unlimited photos, storage managed via compression)

### the agent's Discretion
- Agent has flexibility on exact component structure, file organization, and implementation details
- Agent should follow existing project patterns from Phase 1-2 (auth, pairing, chat features)
- Agent decides waveform library/component implementation
- Agent decides image compression quality/settings
- Agent decides album page layout and navigation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-02 | User can record and send voice messages (WhatsApp-style: hold to record, slide to cancel) | MediaRecorder API + Web Audio API for live waveform + Supabase Storage for persistence |
| CHAT-03 | Voice messages play inline with waveform display | react-audio-visualize AudioVisualizer component or custom canvas |
| CHAT-04 | User can send images in chat | Canvas API compression + Supabase Storage + inline thumbnail rendering |
| HOME-04 | Mini photo album displays horizontally scrollable photos | Album photos table + horizontal scroll component on homepage |
| HOME-05 | User can upload photos to shared album | Album photos table + Supabase Storage bucket + upload flow |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Voice recording (MediaRecorder) | Browser / Client | — | Browser-native API, all processing client-side (D-08) |
| Live waveform during recording | Browser / Client | — | Web Audio API AnalyserNode, canvas rendering |
| Voice message playback | Browser / Client | — | HTML5 Audio element + waveform visualization |
| Image compression | Browser / Client | — | Canvas API toBlob() with quality parameter |
| Image gallery picker | Browser / Client | — | `<input type="file">` or File System Access API |
| Media file storage | CDN / Storage | API / Backend | Supabase Storage buckets with RLS policies |
| Media message persistence | API / Backend | Database / Storage | Supabase client SDK inserts message metadata to DB + uploads file to Storage |
| Album photo management | Database / Storage | Browser / Client | album_photos table with pair_id RLS + Storage bucket |
| Full-screen image viewer | Browser / Client | — | Modal/overlay component with pinch-to-zoom |
| Shared album on homepage | Browser / Client | Database / Storage | Reads from album_photos table, renders horizontal scroll |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none — browser native) | — | Voice recording via MediaRecorder API | Built into all modern browsers, no polyfill needed for target PWA |
| (none — browser native) | — | Live waveform via Web Audio API AnalyserNode | Standard audio analysis, no dependencies |
| (none — browser native) | — | Image compression via Canvas API toBlob() | Zero-dependency, quality parameter, strips EXIF (privacy benefit) |
| react-audio-visualize | 1.2.0 | Audio waveform display components (AudioVisualizer + LiveAudioVisualizer) | 0 dependencies, TypeScript, separate live/static components, lightweight |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| browser-image-compression | 2.0.x | Higher-level image compression with resize + quality control | If Canvas API wrapper needs more features (e.g., target file size) |
| @supabase/supabase-js | ^2.110.8 | Storage upload/download, already in project | All media file persistence (already installed) |
| motion (framer-motion) | ^12.42.2 | Animations for recording UI, album scroll, image viewer transitions | Already in project, use for all new animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-audio-visualize | wavesurfer.js | WaveSurfer is heavier (~40KB) but more feature-rich; react-audio-visualize is lighter (0 deps, ~5KB) and sufficient for chat use case |
| react-audio-visualize | Custom canvas component | Full control but reinvents rendering; react-audio-visualize covers both live recording and static blob visualization |
| Canvas API image compression | browser-image-compression | Canvas API is zero-dep and sufficient; browser-image-compression adds convenience (target file size) but is optional |
| `<input type="file">` | showOpenFilePicker() | File System Access API is newer but has limited iOS support; `<input type="file">` is universal for PWA |
| WebM/Opus recording | MP4/AAC recording | WebM/Opus has better compression and wider MediaRecorder support; MP4 output is Safari-favored but less consistent across browsers |

**Installation:**
```bash
# Only new dependency needed (everything else is browser-native or already installed)
npm install react-audio-visualize
```

**Version verification:** Before writing the Standard Stack table, verify each recommended package exists and is current:
```bash
npm view react-audio-visualize version          # Verify 1.2.0 exists
npm view react-audio-visualize dependencies     # Verify 0 dependencies
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react-audio-visualize | npm | ~2 years | moderate | github.com/samhirtarif/react-audio-visualize | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Note: The MediaRecorder API, Web Audio API, and Canvas API are browser-native — no npm packages needed for core functionality.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     COUPLESPACE PWA                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Chat View    │    │  Album Page  │    │  Homepage    │  │
│  │  (existing)   │    │  (new)       │    │  (new mini)  │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                    │                    │           │
│  ┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼───────┐  │
│  │ Voice Recorder│    │ Album Upload │    │ Album Scroll │  │
│  │ (new component)│   │ (new component)│  │ (new component)│ │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                    │                    │           │
│  ┌──────▼───────┐    ┌──────▼───────┐                  │
│  │ Image Picker  │    │ Full-screen  │                  │
│  │ (new component)│   │ Viewer (new) │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                    │                            │
│  ┌──────▼────────────────────▼───────┐                   │
│  │     Media Processing Layer         │                   │
│  │  • Voice: MediaRecorder → Blob     │                   │
│  │  • Image: Canvas → compressed Blob │                   │
│  └──────────────┬────────────────────┘                   │
│                  │                                         │
│  ┌──────────────▼────────────────────┐                   │
│  │     Zustand Store (chatStore)      │                   │
│  │  • sendVoiceMessage()             │                   │
│  │  • sendImageMessage()             │                   │
│  │  • loadAlbumPhotos()              │                   │
│  │  • uploadAlbumPhoto()             │                   │
│  └──────────────┬────────────────────┘                   │
│                  │                                         │
│  ┌──────────────▼────────────────────┐                   │
│  │     Supabase Client SDK            │                   │
│  │  • storage.from('chat-media')      │                   │
│  │  • storage.from('album-photos')    │                   │
│  │  • from('messages').insert(...)    │                   │
│  │  • from('album_photos').insert()   │                   │
│  └──────────────┬────────────────────┘                   │
│                  │                                         │
├──────────────────▼─────────────────────────────────────────┤
│                     SUPABASE                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ messages  │  │ album_   │  │ Storage   │                │
│  │ (updated) │  │ photos   │  │ buckets   │                │
│  │           │  │ (new)    │  │ (new)     │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
FRONTEND/src/
├── features/
│   ├── chat/
│   │   ├── ChatView.jsx          (extend — add media message rendering)
│   │   ├── VoiceRecorder.jsx     (new — hold-to-record with waveform)
│   │   ├── VoiceMessage.jsx      (new — inline voice playback)
│   │   ├── ImageMessage.jsx      (new — inline image thumbnail)
│   │   ├── ImageViewer.jsx       (new — full-screen image overlay)
│   │   ├── ImagePicker.jsx       (new — gallery file selection)
│   │   ├── chat.css              (extend — voice/image styles)
│   │   └── ...
│   ├── album/
│   │   ├── AlbumPage.jsx         (new — dedicated album page)
│   │   ├── AlbumUpload.jsx       (new — photo upload to album)
│   │   ├── AlbumGrid.jsx         (new — chronological photo grid)
│   │   ├── MiniAlbum.jsx         (new — horizontal scroll on homepage)
│   │   └── album.css
│   └── ...
├── stores/
│   ├── chatStore.js              (extend — voice/image message methods)
│   └── albumStore.js             (new — album state management)
└── shared/
    └── lib/
        ├── supabase.js           (no change — already handles auth)
        ├── mediaRecorder.js      (new — recording utility)
        ├── imageCompress.js      (new — canvas compression utility)
        └── audioWaveform.js      (new — Web Audio API waveform utility)
```

### Pattern 1: Voice Recording with MediaRecorder API
**What:** Hold-to-record pattern using browser MediaRecorder with Web Audio API for live waveform analysis
**When to use:** When recording voice messages with real-time audio visualization
**Example:**
```javascript
// Source: MDN Web Docs - MediaRecorder API
// Core recording flow
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
const analyserNode = new AudioContext().createAnalyser();
const sourceNode = new AudioContext().createMediaStreamSource(stream);
sourceNode.connect(analyserNode);

const chunks = [];
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  // Upload to Supabase Storage
};

// Start recording
mediaRecorder.start(100); // Collect data every 100ms for waveform updates

// Get waveform data (60fps for live visualization)
const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
function drawWaveform() {
  analyserNode.getByteTimeDomainData(dataArray);
  // Render dataArray to canvas
  requestAnimationFrame(drawWaveform);
}
```

### Pattern 2: Client-Side Image Compression via Canvas API
**What:** Resize and compress images before upload using browser Canvas API
**When to use:** Before uploading any image to Supabase Storage
**Example:**
```javascript
// Source: MDN Web Docs - Canvas API + blog posts on client-side compression
async function compressImage(file, { maxWidth = 1920, quality = 0.8 } = {}) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let { width, height } = img;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
    img.src = URL.createObjectURL(file);
  });
}
```

### Pattern 3: Supabase Storage Upload with Pair-Scoped RLS
**What:** Upload media files to Supabase Storage with RLS policies scoped to pair membership
**When to use:** For all voice, image, and album photo uploads
**Example:**
```javascript
// Source: Supabase Docs - Storage Upload + RLS
// Upload to chat-media bucket
const filePath = `${pairId}/${Date.now()}-${fileName}`;
const { data, error } = await supabase.storage
  .from('chat-media')
  .upload(filePath, file, {
    contentType: file.type,
    upsert: false
  });

// Get public URL (for public bucket) or signed URL (for private)
const { data: { publicUrl } } = supabase.storage
  .from('chat-media')
  .getPublicUrl(filePath);
```

### Pattern 4: Extending Messages Table for Media
**What:** Add message_type and media_url columns to support voice and image messages
**When to use:** Database migration for Phase 3
**Example:**
```sql
-- Extend messages table
ALTER TABLE messages
  ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image')),
  ADD COLUMN media_url TEXT,
  ADD COLUMN media_duration INTEGER,  -- for voice: seconds
  ADD COLUMN media_width INTEGER,     -- for image: original width
  ADD COLUMN media_height INTEGER;    -- for image: original height

-- Update content constraint to allow empty content for media messages
ALTER TABLE messages DROP CONSTRAINT content_not_empty;
ALTER TABLE messages ADD CONSTRAINT content_or_media CHECK (
  char_length(content) >= 1 OR media_url IS NOT NULL
);
```

### Anti-Patterns to Avoid
- **Recording without stopping tracks:** Always call `stream.getTracks().forEach(t => t.stop())` after recording ends to release the microphone and stop the browser recording indicator
- **Uploading raw camera files:** Never upload full-resolution photos (5-12MB) directly — always compress client-side first (D-10)
- **Using service role key client-side:** Always use the anon key which respects RLS policies
- **Storing media URLs in content column:** Use the dedicated `media_url` column for media references, keep `content` for text captions or empty strings
- **Blocking UI during upload:** Show optimistic UI (thumbnail appears immediately) while upload happens in background

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio waveform visualization | Custom canvas rendering from scratch | `react-audio-visualize` (AudioVisualizer + LiveAudioVisualizer) | Handles audio decoding, bar rendering, responsive sizing, and played-color tracking |
| Image compression | Manual canvas + toBlob wrapper | Canvas API directly (browser native) | Zero-dep, sufficient for JPEG/WebP compression with quality parameter |
| Voice recording state machine | Complex state logic for MediaRecorder | Simple state machine in Zustand store | MediaRecorder API is straightforward: start/stop/dataavailable |
| File upload to Supabase | Custom upload logic | `supabase.storage.from().upload()` | Handles auth headers, multipart encoding, error handling |
| Full-screen image viewer | Build from scratch | Simple modal overlay with CSS transforms | Pinch-to-zoom is optional; simple tap-to-expand covers MVP |

**Key insight:** The browser's built-in APIs (MediaRecorder, Web Audio, Canvas) are mature and sufficient. Adding heavy libraries for these capabilities is unnecessary complexity for a couples PWA.

## Common Pitfalls

### Pitfall 1: iOS Safari MediaRecorder Limitations
**What goes wrong:** Voice recording fails silently or produces empty blobs on older iOS versions
**Why it happens:** iOS Safari had limited MediaRecorder support before iOS 14.3; some iOS versions have quirks with WebM/Opus format
**How to avoid:** Test on iOS Safari specifically. Use `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')` to check support. Fall back to `audio/mp4` or `audio/wav` on unsupported browsers. The project targets modern browsers (PWA), so iOS 15+ is reasonable.
**Warning signs:** Empty blob after recording, `onerror` event on MediaRecorder

### Pitfall 2: Microphone Permission Not Released
**What goes wrong:** Browser shows persistent recording indicator after user stops recording
**Why it happens:** MediaStream tracks not stopped after recording ends
**How to always stop tracks:** Always call `stream.getTracks().forEach(t => t.stop())` in the MediaRecorder `onstop` handler and in component cleanup (useEffect return)
**Warning signs:** Red recording dot persists in browser tab, user reports "microphone still active"

### Pitfall 3: Large Image Uploads Without Compression
**What goes wrong:** Upload fails or takes too long on slow connections; storage costs balloon
**Why it happens:** Phone cameras produce 5-12MB photos; uploading raw files wastes bandwidth
**How to avoid:** Always compress before upload. Resize to max 1920px width, quality 0.8 JPEG. This typically reduces a 5MB photo to 200-500KB.
**Warning signs:** Upload taking >5 seconds, Supabase Storage warnings about file size

### Pitfall 4: Waveform Rendering Performance
**What goes wrong:** Janky waveform animation during recording, battery drain
**Why it happens:** Requesting waveform data at too high a frequency, or rendering full frequency spectrum instead of time-domain data
**How to use AnalyserNode efficiently:** Use `getByteTimeDomainData()` (not frequency data) for waveform. Request animation at 60fps via `requestAnimationFrame`. Use a single canvas with efficient clearing.
**Warning signs:** Frame drops during recording, high CPU usage in DevTools Performance tab

### Pitfall 5: Supabase Storage RLS Policies Blocking Uploads
**What goes wrong:** Upload returns 403 or empty error; files never appear in storage
**Why it happens:** Storage buckets default to no access; RLS policies must be explicitly created for INSERT, SELECT, and DELETE operations
**How to avoid:** Create the storage bucket AND the RLS policies in the same migration. Test upload immediately after migration.
**Warning signs:** Upload returns `{ error: { message: "new row violates row-level security policy" } }`

### Pitfall 6: Audio Playback on iOS Safari
**What goes wrong:** Voice messages don't play on iOS when tapped; user must tap twice
**Why it happens:** iOS Safari blocks autoplay and requires user gesture to create AudioContext; `AudioContext` must be resumed after user interaction
**How to avoid:** Create/resume AudioContext on the first user tap. Use a play button that explicitly triggers AudioContext creation. Consider using a simple `<audio>` element instead of Web Audio API for playback (simpler, fewer iOS issues).
**Warning signs:** Voice message shows but no audio plays on first tap on iOS

## Code Examples

### Voice Recording Component (WhatsApp-style)
```javascript
// Source: MDN MediaRecorder API + Web Audio API
// Simplified VoiceRecorder component
import { useRef, useState, useCallback, useEffect } from 'react'

export function useVoiceRecorder(maxDuration = 300) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState(new Uint8Array(0))
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const animFrameRef = useRef(null)

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.start(100) // Collect data every 100ms
    setIsRecording(true)

    // Live waveform updates
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const updateWaveform = () => {
      analyser.getByteTimeDomainData(dataArray)
      setWaveformData(new Uint8Array(dataArray))
      animFrameRef.current = requestAnimationFrame(updateWaveform)
    }
    updateWaveform()

    // Duration timer
    timerRef.current = setInterval(() => {
      setDuration(d => {
        if (d >= maxDuration) { stopRecording(); return d }
        return d + 1
      })
    }, 1000)
  }, [maxDuration])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(null)

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        // Cleanup
        streamRef.current?.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        cancelAnimationFrame(animFrameRef.current)
        setIsRecording(false)
        setDuration(0)
        setWaveformData(new Uint8Array(0))
        resolve(blob)
      }

      mediaRecorderRef.current.stop()
    })
  }, [])

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    chunksRef.current = []
    setIsRecording(false)
    setDuration(0)
    setWaveformData(new Uint8Array(0))
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return { isRecording, duration, waveformData, startRecording, stopRecording, cancelRecording }
}
```

### Image Compression Utility
```javascript
// Source: Canvas API + blog posts on client-side compression
export async function compressImage(file, { maxWidth = 1920, quality = 0.8, outputType = 'image/jpeg' } = {}) {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let { width, height } = img
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        blob,
        width,
        height,
        originalSize: file.size,
        compressedSize: blob.size,
        compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(1) + '%'
      })
    }, outputType, quality)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img) }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
```

### Supabase Storage Upload for Chat Media
```javascript
// Source: Supabase Docs - Storage Upload
import { supabase } from '../shared/lib/supabase'

export async function uploadChatMedia(pairId, file, type) {
  const ext = file.name.split('.').pop() || (type === 'voice' ? 'webm' : 'jpg')
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${pairId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('chat-media')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('chat-media')
    .getPublicUrl(filePath)

  return { path: data.path, url: publicUrl }
}
```

### Album Photo Upload
```javascript
// Source: Supabase Docs + project patterns
import { supabase } from '../shared/lib/supabase'

export async function uploadAlbumPhoto(pairId, file, caption = '') {
  const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.8 })
  const ext = 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${pairId}/${fileName}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('album-photos')
    .upload(filePath, compressed.blob, {
      contentType: 'image/jpeg',
      upsert: false
    })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('album-photos')
    .getPublicUrl(filePath)

  // Insert record into album_photos table
  const { data: photoRecord, error: dbError } = await supabase
    .from('album_photos')
    .insert({
      pair_id: pairId,
      url: publicUrl,
      storage_path: uploadData.path,
      caption,
      width: compressed.width,
      height: compressed.height,
      file_size: compressed.compressedSize
    })
    .select()
    .single()

  if (dbError) throw dbError
  return photoRecord
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side audio processing | Client-side MediaRecorder API | 2020+ (browser support matured) | No FastAPI endpoint needed for voice (D-08) |
| Server-side image compression | Client-side Canvas API toBlob() | 2018+ (Canvas API stable) | Reduces upload size 75-90%, saves storage costs |
| wavesurfer.js for waveforms | react-audio-visualize (0 deps) | 2023+ (lighter alternatives emerged) | Smaller bundle, React-native API, sufficient for chat |
| File input with accept attribute | showOpenFilePicker() API | 2022+ (limited iOS support) | `<input type="file">` still better for PWA cross-browser |

**Deprecated/outdated:**
- `opus-media-recorder` polyfill: No longer needed — all modern browsers (Chrome 58+, Firefox 53+, Safari 14.3+) support MediaRecorder natively
- `recorder.js`: Deprecated in favor of native MediaRecorder API

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | react-audio-visualize version 1.2.0 is current and has 0 dependencies | Standard Stack | Planner may need to find alternative if version is stale |
| A2 | Supabase Storage free tier supports the expected upload volume for a couples app | Standard Stack | May need to verify Supabase plan limits |
| A3 | WebM/Opus is supported on all target browsers (Chrome, Firefox, Safari 14.3+, Edge) | Common Pitfalls | Voice recording may fail on older Safari versions |
| A4 | Canvas API quality parameter works consistently across browsers for JPEG compression | Common Pitfalls | Image quality may vary across browsers |
| A5 | `<input type="file" accept="image/*" capture>` works reliably on iOS Safari PWA | Architecture | Image picker may not open camera on iOS |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should the album use a public or private storage bucket?**
   - What we know: Private buckets require signed URLs or JWT auth for access; public buckets allow direct URL access
   - What's unclear: Whether album photos should be publicly accessible via URL or require auth (since they're shared between partners only)
   - Recommendation: Use a **private** bucket with RLS policies scoped to pair membership. Generate signed URLs for display. This matches the privacy model of a couples app.

2. **Should voice messages be downloadable by the partner?**
   - What we know: WhatsApp allows saving voice messages; Supabase Storage supports download
   - What's unclear: Whether download/save functionality is in scope for Phase 3
   - Recommendation: Implement basic playback only for Phase 3. Download can be added later if needed.

3. **Image viewer: simple overlay or full pinch-to-zoom?**
   - What we know: D-09 says "tap to view full-screen"
   - What's unclear: Whether pinch-to-zoom is needed or a simple full-screen overlay is sufficient
   - Recommendation: Start with a simple full-screen overlay (CSS transform scale). Add pinch-to-zoom in a later phase if user requests it.

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase Storage | Voice/image upload | ✓ (via @supabase/supabase-js) | ^2.110.8 | — |
| MediaRecorder API | Voice recording | ✓ (browser native) | Chrome 58+, Firefox 53+, Safari 14.3+ | Show "browser not supported" message |
| Web Audio API | Waveform visualization | ✓ (browser native) | All modern browsers | Simple recording without waveform |
| Canvas API | Image compression | ✓ (browser native) | All modern browsers | Upload without compression (larger files) |
| getUserMedia | Microphone access | ✓ (browser native) | HTTPS required | PWA served over HTTPS on Vercel |

**Missing dependencies with no fallback:**
- None — all dependencies are browser-native or already installed

**Missing dependencies with fallback:**
- getUserMedia may be denied by user → Show permission prompt with clear explanation; fallback to "voice recording unavailable"

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | none — see Wave 0 |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run test:run -- --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-02 | Voice recording starts on hold, stops on release | unit | `npm run test:run -- --reporter=verbose src/test/voiceRecorder.test.js` | ❌ Wave 0 |
| CHAT-02 | Slide left cancels recording | unit | `npm run test:run -- --reporter=verbose src/test/voiceRecorder.test.js` | ❌ Wave 0 |
| CHAT-03 | Voice message plays with waveform | unit | `npm run test:run -- --reporter=verbose src/test/voiceMessage.test.js` | ❌ Wave 0 |
| CHAT-04 | Image compresses before upload | unit | `npm run test:run -- --reporter=verbose src/test/imageCompress.test.js` | ❌ Wave 0 |
| CHAT-04 | Image displays inline in chat | unit | `npm run test:run -- --reporter=verbose src/test/imageMessage.test.js` | ❌ Wave 0 |
| HOME-04 | Mini album renders horizontal scroll | unit | `npm run test:run -- --reporter=verbose src/test/miniAlbum.test.js` | ❌ Wave 0 |
| HOME-05 | Album upload persists to Supabase | integration | `npm run test:run -- --reporter=verbose src/test/albumUpload.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run -- --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/test/voiceRecorder.test.js` — covers CHAT-02 (recording flow)
- [ ] `src/test/voiceMessage.test.js` — covers CHAT-03 (playback)
- [ ] `src/test/imageCompress.test.js` — covers CHAT-04 (compression)
- [ ] `src/test/imageMessage.test.js` — covers CHAT-04 (inline display)
- [ ] `src/test/miniAlbum.test.js` — covers HOME-04 (scroll component)
- [ ] `src/test/albumUpload.test.js` — covers HOME-05 (upload flow)
- [ ] Vitest config: `vitest.config.js` — if none detected
- [ ] Test setup: mock `navigator.mediaDevices`, `MediaRecorder`, `AudioContext`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (existing) — JWT-based access to Storage |
| V3 Session Management | yes | Supabase session persistence (existing) |
| V4 Access Control | yes | RLS policies on storage.objects and album_photos table |
| V5 Input Validation | yes | File type validation (accept list), file size limits, duration limits |
| V6 Cryptography | no | No custom crypto — Supabase handles HTTPS/TLS |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Upload malicious file type | Tampering | Validate file MIME type on client AND server (RLS policy + bucket allowed MIME types) |
| Exceed storage quota | Denial of Service | Client-side validation (5min voice max, image compression), bucket file size limit |
| Access other pair's media | Information Disclosure | RLS policies: `pair_id = auth.uid()'s pair` check on all storage and table operations |
| Record without consent | Tampering | Microphone permission prompt required; recording indicator visible |
| XSS via media URLs | Tampering | Supabase Storage URLs are CDN-hosted, validated; no user-controlled URL rendering |

## Sources

### Primary (HIGH confidence)
- MDN Web Docs - MediaRecorder API (developer.mozilla.org) — Recording API reference
- MDN Web Docs - Web Audio API (developer.mozilla.org) — AnalyserNode for waveform
- Supabase Docs - Storage Upload (supabase.com/docs/guides/storage/uploads) — Upload patterns
- Supabase Docs - Storage Access Control (supabase.com/docs/guides/storage/security) — RLS policies
- react-audio-visualize npm page (npmjs.com/package/react-audio-visualize) — Waveform components

### Secondary (MEDIUM confidence)
- Client-side image compression blog posts (minipx.com, nuvykit.cloud) — Canvas API compression patterns
- WaveformPlayer docs (waveformplayer.com) — Alternative waveform library reference
- wavesurfer.js React guide (zignuts.com) — WaveSurfer integration patterns

### Tertiary (LOW confidence)
- WebSearch results on MediaRecorder iOS Safari compatibility — needs runtime verification
- browser-image-compression npm package — needs legitimacy check if planner chooses it

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Browser-native APIs are well-documented; react-audio-visualize is a real npm package with source repo
- Architecture: HIGH — Extends proven patterns from Phase 1-2; Supabase Storage RLS is well-established
- Pitfalls: HIGH — iOS MediaRecorder quirks and Supabase RLS policies are well-documented failure modes

**Research date:** 2026-07-25
**Valid until:** 2026-08-25 (30 days — stack is stable)
