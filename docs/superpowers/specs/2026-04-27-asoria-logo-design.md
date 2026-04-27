# ASORIA Logo Design Spec — 2026-04-27

## Concept

**Name:** The Compass A
**Style:** Clean Minimal
**Concept:** A narrow-construction capital "A" with a 4-point star compass integrated as the crossbar inside a circular ring. The compass crosshair aligns perfectly with the A's crossbar, creating a unified mark where navigation and architecture are one.

## Visual Description

- **Lettermark:** Narrow "A" in solid #C8C8C8 on dark background (#1A1A1A)
- **Compass crossbar:** A 4-point star inscribed inside a circle, centered on the A's crossbar
- **Center detail:** Small green dot (#7AB87A) at compass center
- **Proportions:** A stroke width ~3-4px, compass circle ~20px diameter, A apex slightly sharp (not fully rounded)
- **Background:** Dark (#1A1A1A) — logo is always presented on dark to match app theme

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| A letterform | Light Gray | #C8C8C8 |
| Compass circle ring | Dim Gray | #5A5550 |
| Compass star / crosshair | Light Gray | #C8C8C8 |
| Compass center dot | Success Green | #7AB87A |
| Background | Near Black | #1A1A1A |
| Text / label (if needed) | Text Primary | #F0EDE8 |

## Construction Grid

```
ViewBox: 80 × 80

A apex:       (40, 10)
A left foot: (20, 65)
A right foot: (60, 65)
A crossbar:  y = 46 (left side), y = 46 (right side)
Compass circle center: (40, 32)
Compass circle radius: 10
Compass star: 4 points, compass rose style
Center dot: r = 2.5 at (40, 32)
```

## Usage Guidelines

### Minimum Size
- App icon: 48px minimum width
- Favicon: 32px minimum
- Never below 24px

### Clear Space
- Minimum padding: 1/3 of logo width on all sides
- The logo should never be crowded by other UI elements

### Color Variants
| Variant | When to use |
|---------|-------------|
| Light on dark (default) | Dark backgrounds, dark mode UI |
| White on transparent | When background is already #1A1A1A |
| Dark on light (inverted) | Light backgrounds, white keylines, print |
| Single color (white only) | Embroidery, single-ink printing |

### Don't Do
- Don't stretch or skew the logo
- Don't add drop shadows or effects not in spec
- Don't change the green center dot color
- Don't recreate the logo in a different typeface — this is the official mark

## File Deliverables Needed

| File | Format | Purpose |
|------|--------|---------|
| logo-mark.svg | SVG | Primary source — vector, any size |
| logo-mark-dark.svg | SVG | On light backgrounds |
| icon-1024.png | PNG | App Store icon |
| icon-512.png | PNG | Play Store + general use |
| icon-192.png | PNG | Home screen shortcut |
| favicon.png | PNG | Browser tab |
| apple-touch-icon.png | PNG | iOS home screen |

## Locked Decisions (Do Not Change)

- A shape construction is final
- Green center dot (#7AB87A) is the only accent color — never add others
- Compass is always 4-point star inside a circle — not 8-point, not open circle
- Letterform color is always #C8C8C8 on dark — never gradient, never chromatic

---

*Spec written: 2026-04-27 | Status: Draft — awaiting user approval*