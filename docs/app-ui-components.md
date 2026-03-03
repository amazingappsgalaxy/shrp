# App UI Component System — Sharpii.ai

**Always read this before building any new `/app/*` page.**
Update this file whenever a new pattern is established or an existing one changes.

---

## 1. Page Layout Architecture

Every processing page follows a strict two-column layout.

```
┌─────────────────────────────────────────────────────────┐
│  UserHeader (fixed, h-16, z-9999)                       │
├────────────────────┬────────────────────────────────────┤
│  LEFT SIDEBAR      │  RIGHT CANVAS                      │
│  420px fixed width │  flex-1                            │
│  scrolls w/ page   │  sticky, stays in viewport         │
│  bg-[#0c0c0e]      │  bg-[#09090b]                      │
│                    │                                    │
│  • Input section   │  • Output viewer (canvas)          │
│  • Settings cards  │  • Status bar                      │
│  • [dividers]      │  • Mode / control section          │
│                    │                                    │
│  FIXED FOOTER      │                                    │
│  cost + CTA btn    │                                    │
└────────────────────┴────────────────────────────────────┘
```

### Root page wrapper
```jsx
// editor/page.tsx:585
<div className="flex flex-col min-h-screen bg-[#09090b] text-white font-sans">
```

### Main grid
```jsx
// editor/page.tsx:596
<div className="flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">
```
- `pt-16` = 4rem = 64px — exactly the header height. No gap, no overlap.
- On mobile: single column, canvas comes first (`order-1`), sidebar second (`order-2`).

### Left sidebar
```jsx
// editor/page.tsx:599
<div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-6rem)] lg:pb-32 order-2 lg:order-1">
```
- `lg:pb-32` reserves space for the fixed footer (128px).
- `border-r border-white/5` — the only separator between columns.

### Right canvas column
```jsx
// editor/page.tsx:855
<div className="relative flex flex-col px-4 pt-2 pb-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] overflow-y-auto custom-scrollbar order-1 lg:order-2">
```
- `lg:top-[4.5rem]` — sticky offset: 8px breathing room below header.
- `lg:h-[calc(100vh-4.5rem)]` — height must match sticky top offset.
- `pt-2` (8px) — top breathing room inside the column. Do NOT use `pt-4` or more.
- **Rule:** `top-[X]` and `h-[calc(100vh-X)]` must always use the same value.

---

## 2. Design Tokens (Never Hardcode Differently)

### Background hierarchy
| Layer | Value | Usage |
|---|---|---|
| Page root | `#09090b` | `bg-[#09090b]` |
| Left sidebar | `#0c0c0e` | Left column, sidebar footer |
| Canvas / black | `#050505` | Output viewer bg |
| Card surface | `bg-white/[0.02]` | Settings cards (very subtle) |
| Card surface alt | `bg-white/[0.03]` | Dashboard section cards |
| Dropdown bg | `#18181b` | CustomDropdown panel & trigger |
| Dropdown hover | `#202024` | CustomDropdown option hover |
| User menu bg | `#0A0A0B` | Radix dropdown menu |
| Hover card bg | `#111113` | Plan upgrade hover card |

### Brand & accent
| Token | Value | Usage |
|---|---|---|
| Brand yellow | `#FFFF00` | CTA buttons, switch checked, slider thumb, **model/style selector** active fill |
| Yellow text accent | `text-[#FFFF00]` on `bg-white/[0.09]` | **Settings controls** active state (segmented pills, resolution cards) — yellow text, NOT full fill |
| Yellow hover | `#e6e600` | Enhance button hover |
| Yellow hover (secondary) | `#c9c900` | Upgrade/Save buttons hover |
| Switch unchecked | `#2a2a2a` | Switch track off state |
| Switch thumb | `black` | Switch thumb (always black) |

### Border opacity scale
| Token | Usage |
|---|---|
| `border-white/5` | Column dividers, section dividers, subtle card borders |
| `border-white/8` | Dashboard section cards |
| `border-white/10` | Standard interactive element borders (inputs, dropdowns, buttons) |
| `border-white/20` | Comparison "Enhanced" badge, SignIn link border |
| `border-white/25` | Input focus state |
| `border-[#FFFF00]` | Active selected button/mode |

### White text opacity scale
| Token | Context |
|---|---|
| `text-white` | Primary content, active states |
| `text-white/90` | Toast text |
| `text-white/80` | Secondary labels, comparison "Original" |
| `text-white/70` | Third-level labels, textarea labels |
| `text-white/60` | Nav inactive, close buttons |
| `text-white/50` | Input labels |
| `text-white/40` | Section card headers (dashboard) |
| `text-white/30` | Disabled/placeholder helper text |
| `text-gray-500` | Section overline headers in sidebar |
| `text-gray-600` | Status bar, empty state icon |
| `text-gray-300` | Empty state title |

### z-index ladder (do not conflict)
| Layer | z-index |
|---|---|
| Sidebar | `z-20` |
| Comparison action buttons | `z-30` |
| Sidebar fixed footer | `z-40` |
| Task indicator | `z-50` |
| Header | `z-[9999]` |
| User dropdown menu | `z-[10000]` |
| Plans overlay | `z-[10000]` |
| Hover card | `z-[10001]` |
| Toast | `z-[9999]` |
| Expand modal | `z-[9999]` |

---

## 3. Typography Rules

**Section overline (sidebar labels like "INPUT IMAGE", "AREA PROTECTION"):**
```
text-xs font-black text-gray-500 uppercase tracking-wider
```

**Control card label (slider label, toggle label):**
```
text-xs font-semibold text-white
```

**Mode button labels / segmented control labels:**
```
text-[12px] font-black uppercase tracking-wider
```

**Status bar / metadata (bottom of canvas):**
```
text-[10px] text-gray-600 font-mono uppercase tracking-wider
```

**Slider axis labels (left/right):**
```
text-[10px] font-bold text-gray-500 select-none
```

**Input field text:** `text-sm text-white`
**Input placeholder:** `placeholder:text-white/20` or `placeholder-white/20`
**Input label:** `text-xs text-white/50 mb-1.5`

**Rule:** All section-level labels use `uppercase tracking-wider`. All control-level labels use sentence case. Never mix.

---

## 4. Section Structure — Left Sidebar

### Top input section (image + primary selector side-by-side)
```jsx
// editor/page.tsx:602–673
<div className="border-b border-white/5">
  {/* Header row */}
  <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-5 pb-[0.3rem]">
    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Input Image</span>
    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Skin Style</span>
  </div>
  {/* Content row */}
  <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-1 pb-3">
    {/* Left: square thumbnail input zone */}
    {/* Right: style/option buttons */}
  </div>
</div>
```
- Always `border-b border-white/5` to separate from settings area below.
- The 40/60 split is specific to image+style. For other page types, use what makes sense but keep the `px-5` padding and `border-b border-white/5` separator.

### Input image zone
```jsx
// editor/page.tsx:627–645
<div className="w-full aspect-square rounded-lg bg-black border border-white/10 overflow-hidden relative cursor-pointer group hover:border-[#FFFF00]/50 transition-colors">
  {/* Shows image if uploaded, otherwise empty state */}
</div>
```
- **ALWAYS `aspect-square`** — never use `aspect-video` or fixed pixel height for input images. Every page must use square thumbnails.
- **ALWAYS use `grid grid-cols-[40%_60%]`** for the input section, even when the 60% column is empty (use `<div />`). This ensures consistent sizing across all pages.
- `hover:border-[#FFFF00]/50` — always use this for any clickable upload zone.
- **Delete button position**: ALWAYS in the header row, inline next to the section label using `flex items-center justify-between`. NEVER use an overlay on the image. Classes: `p-2 -mr-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all`

**Standard input image section (works for any page — use the same grid even if right column is empty):**
```jsx
<div className="border-b border-white/5">
  {/* Header row */}
  <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-5 pb-[0.3rem]">
    <div className="flex items-center justify-between h-6">
      <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Input Image</span>
      {uploadedImage && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteImage() }}
          className="p-2 -mr-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
          title="Delete Image"
        >
          <IconTrash className="w-4 h-4" />
        </button>
      )}
    </div>
    <div className="h-6">{/* right column header — label or empty */}</div>
  </div>
  {/* Image row */}
  <div className="grid grid-cols-[40%_60%] gap-4 px-5 pt-1 pb-4">
    <div className="w-full aspect-square rounded-lg bg-black border border-white/10 overflow-hidden relative cursor-pointer group hover:border-[#FFFF00]/50 transition-colors">
      {/* image or empty state */}
    </div>
    <div>{/* right column content or empty */}</div>
  </div>
</div>
```

### Settings scroll area wrapper
```jsx
// editor/page.tsx:676
<div className="p-3 space-y-3 flex-1">
```
- `p-3` outside padding, `space-y-3` between groups.

### Settings group (logical grouping)
```jsx
<div className="space-y-2 px-1">
  {/* Section divider + label if needed */}
  {/* Cards */}
</div>
```
- `space-y-2 px-1` inside each group.

### Section divider with icon + label
```jsx
// editor/page.tsx:760–763
<div className="flex items-center gap-2 pt-2 border-t border-white/5">
  <IconShield className="w-3.5 h-3.5 text-gray-500" />
  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Area Protection</span>
</div>
```

---

## 5. Settings Card Patterns

All settings cards share this base philosophy:
- `bg-white/[0.02]` surface (nearly invisible, just a hint)
- `border border-white/5` idle border
- `hover:border-white/10` hover border
- `rounded-xl` corners
- `transition-all`

### Slider / number control card
```jsx
// editor/page.tsx:738–754
<div className="space-y-3 group p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
  <div className="flex justify-between items-center px-1">
    <span className="text-xs font-semibold text-white">{label}</span>
    <span className="font-mono text-[12px] text-white bg-white/5 px-1.5 py-0.5 rounded">{value}</span>
  </div>
  <MechanicalSlider ... />
</div>
```

### Toggle / boolean control card
```jsx
// editor/page.tsx:726–734
<div className="flex items-center justify-between group p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
  <span className="text-xs font-medium text-white">{label}</span>
  <Switch checked={...} onCheckedChange={...} className="scale-90 origin-right" />
</div>
```

### Feature card (icon + label + control, like Smart Upscale)
```jsx
// editor/page.tsx:682–717
<div className="rounded-xl overflow-hidden border border-white/5">
  {/* Header bar */}
  <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded bg-black/20 text-[#FFFF00]">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-bold text-white">{label}</span>
    </div>
    <Switch className="scale-90 data-[state=checked]:bg-[#FFFF00]" />
  </div>
  {/* Expandable body — always visible or conditionally shown */}
  <div className="p-2 bg-black/20">
    {/* Sub-control, e.g. segmented control */}
  </div>
</div>
```
- `overflow-hidden` on the outer container clips rounded corners cleanly.
- Use this pattern for any feature that has a primary toggle + secondary controls.

### Accent colour rule — two tiers

**Tier 1 — Model / Style selectors (primary choice):**
Use full yellow fill. These are the top-level selectors that determine what model or style is used.
```jsx
// Active: full yellow background
"bg-[#FFFF00] text-black shadow-md"
// Inactive: dimmed text
"text-gray-400 hover:text-white"
```

**Tier 2 — Settings controls (secondary options within a model):**
Use subtle grey background with yellow highlight text only. No full yellow fill.
```jsx
// Active: translucent grey bg + yellow text
"bg-white/[0.09] text-[#FFFF00] shadow-sm"
// Inactive: dimmed grey text
"text-gray-500 hover:text-white"
```

This rule keeps yellow reserved for primary model/style choices so the UI doesn't feel oversaturated with yellow throughout the settings. The CTA button is always full yellow regardless.

---

### Segmented control (iOS pill style)

**Model/Style selector variant (Tier 1 — full yellow):**
```jsx
// upscaler/page.tsx — model selector
<div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)] flex-col gap-1">
  {models.map(m => (
    <button
      key={m}
      onClick={() => setModel(m)}
      className={cn(
        "w-full py-2.5 px-2 text-xs font-[900] rounded-md transition-all uppercase tracking-wider text-center",
        selected === m ? "bg-[#FFFF00] text-black shadow-md" : "text-gray-400 hover:text-white"
      )}
    >
      {label}
    </button>
  ))}
</div>
```
- Stacked vertically (`flex-col gap-1`) for model lists.
- Font weight 900, full names spelled out ("Professional Upscaler" not "Pro").
- Description text rendered inline below the pill container (`text-[10px] text-gray-500 leading-relaxed px-1`), switches with selected model.

**Settings control variant (Tier 2 — grey + yellow text):**
```jsx
// upscaler/page.tsx — skin enhancement, resolution selector
<div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
  {options.map(opt => (
    <button
      key={opt}
      onClick={() => setSelected(opt)}
      className={cn(
        "flex-1 py-2 text-[11px] font-black rounded-md transition-all uppercase tracking-wider",
        selected === opt
          ? "bg-white/[0.09] text-[#FFFF00] shadow-sm"
          : "text-gray-500 hover:text-white"
      )}
    >
      {opt}
    </button>
  ))}
</div>
```
- Track is identical: `bg-[rgb(255_255_255_/_0.04)]` bg and border.
- Active: subtle grey bg (`bg-white/[0.09]`) + yellow text only — no full fill.

### Option cards (e.g. resolution selector cards)
```jsx
// upscaler/page.tsx — resolution cards (Tier 2 style)
<div className="grid grid-cols-2 gap-2">
  <button
    onClick={() => setResolution('4k')}
    className={cn(
      "rounded-lg border p-3 transition-all text-left",
      resolution === '4k' ? "border-white/20 bg-white/5" : "border-white/5"
    )}
  >
    <div className={cn("text-sm font-semibold", resolution === '4k' ? "text-[#FFFF00]" : "text-white")}>4096 × 4096</div>
    <div className="text-[10px] text-gray-500 mt-1 leading-snug">Balanced quality and speed</div>
  </button>
</div>
```
- **Selected card**: `border-white/20 bg-white/5`, primary text turns `text-[#FFFF00]`.
- **Unselected card**: `border-white/5`, text stays `text-white`.
- Cards must contain a primary value + a small caption only.

### Section heading with toggle + caption (upscaler pattern)

Use when a section can be toggled on/off and has a brief descriptive subtitle.

```jsx
// upscaler/page.tsx — Portrait Mode, Max Mode
<div className="border-b border-white/5 px-5 py-5">
  {/* Heading row */}
  <div className="flex items-center justify-between mb-1">
    <div>
      <span className="text-xs font-black text-white uppercase tracking-wider">Portrait Mode</span>
      <p className="text-[10px] text-gray-500 mt-0.5">Optimized for portraits with realistic skin.</p>
    </div>
    <Toggle checked={portrait} onChange={setPortrait} />
  </div>

  {/* Conditional sub-settings */}
  {portrait && (
    <div className="mt-4 rounded-xl overflow-hidden border border-white/5">
      {/* sub-rows here */}
    </div>
  )}
</div>
```
- Heading style: `text-xs font-black text-white uppercase tracking-wider` — matches Input Image / Model labels exactly, but **white not gray** (not dimmed).
- Caption: `text-[10px] text-gray-500 mt-0.5`.
- Toggle sits on the right of the heading row, not the caption row.

### Sub-settings container (upscaler pattern)

When a toggle reveals a group of related sub-controls, wrap them in a bordered container:

```jsx
// upscaler/page.tsx — portrait mode sub-settings
<div className="mt-4 rounded-xl overflow-hidden border border-white/5">
  {/* Row 1 — inline label + control */}
  <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] border-b border-white/5">
    <p className="text-xs font-semibold text-white shrink-0">Skin Enhancement</p>
    {/* segmented control */}
  </div>
  {/* Row 2 — label above + input */}
  <div className="p-3 bg-white/[0.02]">
    <p className="text-xs font-semibold text-white mb-2">Fine-tune Prompt</p>
    <input ... />
  </div>
</div>
```
- Outer: `rounded-xl overflow-hidden border border-white/5` — same as feature cards.
- Each row: `bg-white/[0.02]`, separated by `border-b border-white/5`.
- Row label: `text-xs font-semibold text-white` (sentence case, not uppercase).

### Inline label + segmented control row

When a setting has a short label and the control fits on the same line:

```jsx
// upscaler/page.tsx — Skin Enhancement row
<div className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] border-b border-white/5">
  <p className="text-xs font-semibold text-white shrink-0">Skin Enhancement</p>
  <div className="flex bg-[rgb(255_255_255_/_0.04)] p-1 rounded-lg border border-[rgb(255_255_255_/_0.04)]">
    {/* segmented buttons */}
  </div>
</div>
```
- `shrink-0` on label so it doesn't compress.
- Use when label is ≤2 words and control has ≤4 options. For longer labels or more options, use label-above layout.

### Small toggle row (area protection style)
```jsx
// editor/page.tsx:772–779
<div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
  <span className="text-xs font-medium text-white capitalize">{key}</span>
  <Switch checked={val} onCheckedChange={...} className="scale-75 origin-right" />
</div>
```
- `rounded` (not `rounded-xl`) for compact rows.
- Switch scale: `scale-75` for compact, `scale-90` for standard.

---

## 6. Fixed Sidebar Footer (CTA + Cost)

```jsx
// editor/page.tsx:820–850
<div className="lg:fixed lg:bottom-0 lg:left-0 lg:w-[420px] relative w-full bg-[#0c0c0e] border-t border-white/5 z-40">
  {/* Cost row */}
  <div className="px-5 pt-4 pb-3">
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 font-medium">Estimated Cost</span>
      <div className="flex items-center gap-2">
        <CreditIcon className="w-6 h-6 rounded-md" iconClassName="w-3 h-3" />
        <span className="font-mono font-medium text-white/90">{cost}</span>
      </div>
    </div>
  </div>
  {/* CTA button */}
  <div className="p-5 pt-0">
    <button className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider">
      <Icon className="w-5 h-5 fill-black" />
      <span>Action Label</span>
    </button>
  </div>
</div>
```

**Rules:**
- CTA is always `h-14 rounded-xl bg-[#FFFF00] text-black font-bold`.
- The yellow glow shadow is mandatory: `shadow-[0_0_20px_rgba(255,255,0,0.1)]` idle, `hover:shadow-[0_0_30px_rgba(255,255,0,0.3)]` hover.
- Cost label always uses `font-mono` for the number.
- CreditIcon in footer: `w-6 h-6 rounded-md` with `iconClassName="w-3 h-3"`.
- Loading state: replace icon with `<IconLoader2 className="w-5 h-5 animate-spin" />`.

---

## 7. Right Canvas — Output Viewer

### Canvas container (universal wrapper)
```jsx
// editor/page.tsx:856
<div className="w-full relative flex items-center justify-center bg-[#050505] custom-checkerboard rounded-2xl border border-white/5 overflow-hidden h-[400px] lg:flex-1 lg:min-h-[400px] flex-shrink-0">
```
- `bg-[#050505] custom-checkerboard` — checkerboard shows transparency.
- `rounded-2xl border border-white/5` — always use this exact rounding/border.
- `h-[400px] lg:flex-1 lg:min-h-[400px]` — fixed height on mobile, fills sticky height on desktop.

### Output type patterns

**A) Before/After image comparison (ComparisonView)**
```jsx
// editor/page.tsx:138–214
// Use when: model produces an enhanced/modified version of input image
<ComparisonView
  original={uploadedImage}
  enhanced={enhancedUrl}
  onDownload={handleDownload}
  onExpand={() => setIsExpandViewOpen(true)}
/>
```
- Slider line: `w-0.5 bg-white`, handle: `w-8 h-8 bg-white rounded-full`
- "Original" badge: `bg-black/50`, "Enhanced" badge: `bg-white/20`
- Action buttons (download/expand): `p-3 bg-white text-black rounded-full shadow-xl hover:scale-105`

**B) Single image output**
```jsx
// Use when: model produces an image unrelated to input (generation, style transfer)
<img src={outputUrl} className="w-full h-full object-contain" alt="Output" />
```
- No slider, no labels, just the output filling the canvas.

**C) Video output**
```jsx
// editor/page.tsx:877–883
<video src={outputUrl} controls className="w-full h-full object-contain" />
```
- Wrap in `<div className="relative w-full h-full flex items-center justify-center bg-black/40">`

**D) Before/After video comparison**
- Not yet implemented. When building: mirror the ComparisonView pattern but synchronize two `<video>` elements at the same currentTime. Slider clips one video using `clipPath` just like image comparison.

**E) Multiple outputs (thumbnail strip)**
```jsx
// editor/page.tsx:896–922
<div className="absolute right-4 inset-y-0 z-20 flex flex-col justify-center gap-2 pointer-events-none">
  {outputs.map((output, idx) => (
    <button
      key={...}
      onClick={...}
      className={cn(
        "w-16 h-16 rounded-lg border transition-all overflow-hidden bg-black/50 pointer-events-auto",
        selectedIdx === idx
          ? "border-white/70 shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-105"
          : "border-white/10 hover:border-white/30 hover:scale-105"
      )}
    >
      <img ... className="w-full h-full object-cover" />
    </button>
  ))}
</div>
```
- Strip always floats on the right edge of the canvas (`absolute right-4`).

### Empty state (no input uploaded)
```jsx
// editor/page.tsx:857–865
<div className="text-center cursor-pointer p-12 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
  <IconUpload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-300">No Image Selected</h3>
  <p className="text-sm text-gray-500 mt-2">Upload an image to start editing</p>
</div>
```
- For video input pages: swap icon to `IconVideo`, update copy.

### Processing pending state (input uploaded, no output yet)
```jsx
// editor/page.tsx:885–894
<img src={uploadedImage} className="w-full h-full object-contain opacity-50 blur-sm" />
<div className="absolute inset-0 flex items-center justify-center">
  <div className="bg-black/80 backdrop-blur px-6 py-3 rounded-full border border-white/10 text-gray-300 text-sm">
    Click enhance to process
  </div>
</div>
```
- Always blur + dim the input at `opacity-50 blur-sm`.
- Pill: `rounded-full bg-black/80 backdrop-blur border border-white/10`.

### Status bar (below canvas)
```jsx
// editor/page.tsx:926–933
<div className="mt-4 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
  <div>{/* Source info: dimensions, format */}</div>
  <div>Sharpii Engine v2.0</div>
</div>
```
- Always `mt-4`, always `font-mono uppercase tracking-wider text-[10px] text-gray-600`.
- Right side always shows engine/version tag.

---

## 8. Mode Selector — Below Canvas

The mode selector lives in the right column, below the canvas. It controls the processing mode.

```jsx
// editor/page.tsx:937–1011
<div className="mt-4 px-4 pb-8 w-full space-y-4">
  {/* Section label */}
  <h3 className="text-xs font-black text-gray-500 mb-3 flex items-center gap-2 tracking-wider uppercase">
    Mode Label
  </h3>

  {/* Mode buttons row */}
  <div className="flex items-start gap-2">
    <div className="grid grid-cols-4 gap-2 flex-1">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          className={cn(
            "relative h-14 rounded-lg overflow-hidden group border transition-all flex items-center justify-center",
            selected === mode.id
              ? "border-[#FFFF00] shadow-[0_0_10px_rgba(255,255,0,0.2)] bg-white/5"
              : "border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5"
          )}
        >
          {/* Optional: background image showing preview */}
          <img src={previewImg} className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            selected === mode.id ? "opacity-50" : "opacity-40 group-hover:opacity-50"
          )} />
          <span className={cn(
            "relative z-10 text-[12px] font-black uppercase tracking-wider truncate px-1",
            selected === mode.id ? "text-[#FFFF00]" : "text-white"
          )}>
            {mode.label}
          </span>
        </button>
      ))}
    </div>

    {/* Optional: Custom/advanced button at the end */}
    <button className={cn(
      "w-auto px-4 h-14 rounded-lg flex items-center justify-center transition-all border shrink-0 gap-2",
      selected === 'Custom'
        ? "border-[#FFFF00] text-[#FFFF00] bg-white/5 shadow-[0_0_10px_rgba(255,255,0,0.2)]"
        : "border-white/5 text-white hover:border-white/20 bg-black/40"
    )}>
      <Icon className="w-6 h-6" />
      <span className="text-[12px] font-black uppercase tracking-wider">Custom</span>
    </button>
  </div>

  {/* Conditional text input for custom mode */}
  {selected === 'Custom' && (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/70 px-1">Description label</label>
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all min-h-[80px] resize-none"
        placeholder="..."
      />
    </div>
  )}
</div>
```

**Rules:**
- Mode buttons: `h-14 rounded-lg` — fixed height.
- Active: `border-[#FFFF00] shadow-[0_0_10px_rgba(255,255,0,0.2)]`.
- Inactive: `border-white/5 bg-black/40`.
- Always `uppercase tracking-wider text-[12px] font-black` for mode labels.
- If modes have image previews, use the user's uploaded image as the bg at low opacity.

---

## 9. Input / Form Field Patterns

**Standard text input (from UserSettingsSection.tsx:148–154):**
```jsx
<input
  type="text"
  className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
/>
```

**Textarea (from editor/page.tsx:1003–1008):**
```jsx
<textarea
  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all min-h-[80px] resize-none"
/>
```

**CustomDropdown (for option selection):**
```jsx
// components/ui/custom-dropdown.tsx
// Trigger: bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-sm
// Panel: bg-[#18181b] border border-white/10 rounded-lg shadow-2xl
// Active option: bg-white/10
// Hover option: bg-white/5
```

**Rules:**
- Always `bg-white/5 border border-white/10` for enabled fields.
- Always `focus:border-white/25 transition-all` for focus.
- Never use a light background or colored ring for focus — only the border lightens.
- Disabled fields: `bg-white/[0.02] border border-white/6 text-white/25 cursor-not-allowed`.
- With leading icon: `pl-8`, icon absolute-positioned at `left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25`.

---

## 10. Notification & Feedback System

### Task progress indicator (MyLoadingProcessIndicator)
**File:** `src/components/ui/MyLoadingProcessIndicator.tsx`

```jsx
// editor/page.tsx:1028–1038
<MyLoadingProcessIndicator
  isVisible={visibleTasks.length > 0}
  tasks={visibleTasks}
  onCloseTask={(taskId) => { /* dismiss */ }}
/>
```

Panel style: `bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3`
Position: fixed bottom center at `bottom: 2rem`, `z-index: 50`
Motion: slides up from bottom via framer-motion.

- **loading:** white spinner + progress bar + % text
- **success:** `bg-green-500` circle with checkmark SVG. Also plays a Web Audio API chime.
- **error:** `bg-red-500` circle with X SVG. Error message shown as the task `message` field.

**Rule:** The task indicator handles ALL enhancement states (loading → success/error). Do NOT add a separate toast for the same state — it creates double popups. The only toasts allowed independently are for states that have NO task entry (e.g. "not enough credits").

### Toast system (simple non-task notifications)
```jsx
// editor/page.tsx:1040–1060
// Container: fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
// Error: bg-red-500/20 border-red-500/30 rounded-full px-4 py-2
// Text: uppercase tracking-wider font-medium text-xs
```
- Use ONLY for messages that have no corresponding task entry.
- Auto-dismiss after 5000ms.
- Never show simultaneously with a task indicator for the same event.

### Credit gate flow
```jsx
// editor/page.tsx:406–416
if (creditBalance <= 0) {
  openPlansPopup()  // window.dispatchEvent(new CustomEvent('sharpii:open-plans'))
  return
}
if (creditBalance < creditCost) {
  // toast: "Not enough credits. Top up your account from the dashboard."
}
```
- Zero credits → open plans popup silently (no toast).
- Insufficient credits → toast only (no task created).
- 402 from API → open plans popup, delete task silently.

---

## 11. Component Reference

### MechanicalSlider
**File:** `src/components/ui/mechanical-slider.tsx`

```jsx
<MechanicalSlider
  value={[numericValue]}
  min={0} max={1} step={0.01}
  leftLabel="Subtle"
  rightLabel="Strong"
  onValueChange={([v]) => setValue(v)}
/>
```
- Yellow `#FFFF00` thumb with glow: `shadow-[0_0_15px_rgba(255,255,0,0.5)]`
- Tick marks animate like macOS Dock (scale + color based on proximity to thumb)
- Active ticks within 3% of thumb: `#FFFF00`
- Plays a soft mechanical click sound on drag (Web Audio API, triangle wave)

### Switch
**File:** `src/components/ui/switch.tsx`

```jsx
<Switch
  checked={value}
  onCheckedChange={setValue}
  className="scale-90 data-[state=checked]:bg-[#FFFF00]"
/>
```
- Checked: `bg-[#FFFF00]`, Unchecked: `bg-[#2a2a2a]`
- Thumb: always `bg-black`
- Scale variants used: `scale-90` (standard), `scale-75` (compact rows)
- Origin variants: `origin-right` (right-aligned rows), none (centered)

### CustomDropdown
**File:** `src/components/ui/custom-dropdown.tsx`

```jsx
<CustomDropdown
  options={[{ value: 'a', label: 'Option A', description: 'Optional sub-text' }]}
  value={selected}
  onChange={setSelected}
  placeholder="Select..."
/>
```

### CreditIcon
**File:** `src/components/ui/CreditIcon.tsx`
Yellow Zap icon in a `bg-[#FFFF00]/10` container. Props: `className` (container), `iconClassName` (icon).

### ExpandViewModal
**File:** `src/components/ui/expand-view-modal.tsx`
Full-screen comparison modal. `95vw × 90vh`, `bg-black/90 backdrop-blur-2xl` overlay.

### ElegantLoading
**File:** `src/components/ui/elegant-loading.tsx`
Full-page loading state. Use during `isLoading` auth check.

---

## 12. Building a New Processing Page — Checklist

When creating a new page (e.g. image-to-video, upscaler, generator):

**Layout:**
- [ ] Root: `flex flex-col min-h-screen bg-[#09090b] text-white font-sans`
- [ ] Grid: `flex-1 pt-16 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start`
- [ ] Left sidebar: `flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-6rem)] lg:pb-32 order-2 lg:order-1`
- [ ] Right column: `relative flex flex-col px-4 pt-2 pb-4 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] overflow-y-auto custom-scrollbar order-1 lg:order-2`

**Left sidebar:**
- [ ] Top section (`border-b border-white/5`) for primary inputs
- [ ] Settings area (`p-3 space-y-3 flex-1`) for controls
- [ ] Use slider cards, toggle cards, feature cards consistently (see §5)
- [ ] Fixed footer with CTA (see §6)

**Right canvas:**
- [ ] Canvas wrapper: `bg-[#050505] custom-checkerboard rounded-2xl border border-white/5` (see §7)
- [ ] Choose correct output type: comparison / single image / video / multi-output (see §7)
- [ ] Empty state with dashed border upload zone (see §7)
- [ ] Pending state: blurred input + pill overlay (see §7)
- [ ] Status bar below canvas (see §7)
- [ ] Mode selector section below status bar (see §8)

**Notifications:**
- [ ] Use `MyLoadingProcessIndicator` for all task states
- [ ] Do NOT add error toasts for states already shown in task indicator
- [ ] Handle credit gate with `openPlansPopup()` (see §10)

**Tokens:**
- [ ] Never use a bg other than the defined hierarchy (see §2)
- [ ] Model/style selectors: active = `bg-[#FFFF00] text-black` (full yellow fill) — see §5 Tier 1
- [ ] Settings controls (segmented pills, resolution cards): active = `bg-white/[0.09] text-[#FFFF00]` — see §5 Tier 2
- [ ] CTA always `bg-[#FFFF00] text-black h-14 rounded-xl`
- [ ] Section overline headers (sidebar): `text-xs font-black text-gray-500 uppercase tracking-wider`
- [ ] Section headings with toggle (like Portrait Mode): `text-xs font-black text-white uppercase tracking-wider` — **white, not gray**

---

## 13. Key File Locations

| Component | Path |
|---|---|
| Editor page | `src/app/app/editor/page.tsx` |
| Upscaler page | `src/app/app/upscaler/page.tsx` |
| User header | `src/components/app/UserHeader.tsx` |
| Mechanical slider | `src/components/ui/mechanical-slider.tsx` |
| Switch | `src/components/ui/switch.tsx` |
| Custom dropdown | `src/components/ui/custom-dropdown.tsx` |
| Expand view modal | `src/components/ui/expand-view-modal.tsx` |
| Credit icon | `src/components/ui/CreditIcon.tsx` |
| Task indicator | `src/components/ui/MyLoadingProcessIndicator.tsx` |
| Elegant loading | `src/components/ui/elegant-loading.tsx` |
| Input style ref | `src/components/app/dashboard/UserSettingsSection.tsx:148` |
| Dashboard layout | `src/app/app/dashboard/page.tsx` |
| App layout | `src/app/app/layout.tsx` |

---

*Last updated: February 2026 — added two-tier accent rule, upscaler section heading + toggle + caption pattern, sub-settings container, inline label + control row*
*Source of truth: `src/app/app/editor/page.tsx` — always cross-reference when patterns seem unclear.*
