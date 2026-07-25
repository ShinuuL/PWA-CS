# Phase 3: Voice & Image Sharing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 3-Voice & Image Sharing
**Areas discussed:** Voice Recording UX, Audio Storage & Format, Image Sharing in Chat, Shared Photo Album

---

## Voice Recording UX

### Recording Method

| Option | Description | Selected |
|--------|-------------|----------|
| Hold to record | WhatsApp-style: hold mic button, release to send | ✓ |
| Tap to start/stop | Tap once to start, tap again to stop | |
| Toggle recording | Single tap toggles recording on/off | |

**User's choice:** Hold to record (WhatsApp-style)
**Notes:** Most familiar pattern for voice messaging

### Waveform Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Live waveform | Real-time audio visualization during recording | ✓ |
| Static icon | Simple mic icon with timer | |
| No visualization | Just timer and send/cancel buttons | |

**User's choice:** Live waveform during recording
**Notes:** Provides visual feedback that recording is active

### Cancel Gesture

| Option | Description | Selected |
|--------|-------------|----------|
| Slide left to cancel | Slide finger left while holding to cancel | ✓ |
| Swipe down | Swipe down to cancel | |
| Cancel button | Dedicated cancel button appears | |

**User's choice:** Slide left to cancel
**Notes:** Standard WhatsApp-style cancel gesture

### UI Layout During Recording

| Option | Description | Selected |
|--------|-------------|----------|
| Replace input bar | Recording UI replaces the text input area | ✓ |
| Overlay | Recording UI appears as overlay on top of chat | |
| Bottom sheet | Recording UI appears in bottom sheet | |

**User's choice:** Replace input bar during recording
**Notes:** Clean transition, familiar pattern

---

## Audio Storage & Format

### Storage Location

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Storage | Use Supabase Storage bucket | ✓ |
| External CDN | Use Cloudinary or similar | |
| Custom backend | FastAPI endpoint for storage | |

**User's choice:** Supabase Storage bucket
**Notes:** Integrates with existing auth/RLS, no external dependencies

### Audio Format

| Option | Description | Selected |
|--------|-------------|----------|
| WebM/Opus | Modern, small file size, good quality | ✓ |
| MP3 | Universal compatibility, larger files | |
| WAV | Uncompressed, large files | |

**User's choice:** WebM/Opus
**Notes:** Supported by MediaRecorder API in all modern browsers

### Max Duration

| Option | Description | Selected |
|--------|-------------|----------|
| 5 minutes max | Reasonable limit for chat voice messages | ✓ |
| No limit | No duration limit | |
| 1 minute max | Short voice messages only | |

**User's choice:** 5 minutes max
**Notes:** Prevents abuse, keeps files reasonable

### Processing

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side only | Record and upload directly from browser | ✓ |
| Server-side processing | Upload raw, process on FastAPI | |

**User's choice:** Client-side only (agent decision)
**Notes:** Simpler, no FastAPI endpoint needed for audio processing

---

## Image Sharing in Chat

### Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Inline thumbnails | Images show as thumbnails, tap to view full-screen | ✓ |
| Full-width images | Images display at full width in chat | |

**User's choice:** Inline thumbnails
**Notes:** Familiar pattern, saves space in chat

### Compression

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side compression | Compress in browser before uploading | ✓ |
| No compression | Upload original quality | |

**User's choice:** Client-side compression before upload
**Notes:** Reduces storage costs, faster uploads

### Multi-image Support

| Option | Description | Selected |
|--------|-------------|----------|
| Single image only | One image per message | ✓ |
| Multi-image | Select multiple images in one message | |

**User's choice:** Single image per message
**Notes:** Matches WhatsApp default behavior

### Image Picker

| Option | Description | Selected |
|--------|-------------|----------|
| Gallery picker | Tap image icon opens device gallery | ✓ |
| Camera or gallery | Choice between taking new photo or picking from gallery | |

**User's choice:** Gallery picker
**Notes:** Standard mobile pattern

---

## Shared Photo Album

### Album Location

| Option | Description | Selected |
|--------|-------------|----------|
| Homepage section | Mini photo album on homepage only | |
| Separate album page | Dedicated album page only | |
| Both | Mini album on homepage + full album page | ✓ |

**User's choice:** Both locations
**Notes:** Best of both - quick access on homepage + full management on dedicated page

### Upload Flow

| Option | Description | Selected |
|--------|-------------|----------|
| From chat only | Photos sent in chat automatically added to album | |
| Direct upload to album | Separate upload button on album page | ✓ |
| Both | Photos from chat + direct upload | |

**User's choice:** Direct upload to album
**Notes:** More control over what goes into the album

### Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Chronological | Photos sorted by upload date | ✓ |
| By date taken | Photos sorted by EXIF date | |

**User's choice:** Chronological (agent decision)
**Notes:** Simple, familiar pattern

### Capacity Limit

| Option | Description | Selected |
|--------|-------------|----------|
| No limit | Unlimited photos | ✓ |
| 100 photos max | Soft limit with warning | |

**User's choice:** No limit (agent decision)
**Notes:** Storage managed via compression, simpler UX

---

## the agent's Discretion

- Exact component structure and file organization for voice/image features
- Waveform visualization library/component implementation
- Image compression quality/settings
- Album page layout and navigation details
- Integration with existing chat system (Phase 2)

## Deferred Ideas

None — discussion stayed within phase scope
