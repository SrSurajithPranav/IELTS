# IELTS App - Modern UI Design Specification

## Design System

### Color Palette (5 Colors Maximum)
**Primary Brand**
- Accent: #4F8EF7 (Vibrant Blue) - Main CTA buttons, active states
- Success: #10A981 (Teal) - Positive actions, progress indicators

**Neutrals**
- Background: #0F1419 (Deep Dark) - Main background
- Surface: #1A1F29 (Surface Dark) - Cards, containers
- Text Primary: #F5F7FA (Off-white) - Main text
- Text Muted: #8B92A2 (Muted Gray) - Secondary text

**Functional**
- Warning: #F59E0B (Amber) - Alerts, weak areas
- Danger: #EF4444 (Red) - Destructive actions

### Typography (2 Fonts)
**Headings:** Playfair Display (or similar serif)
- Font-weight: 700
- Sizes: 32px (H1), 24px (H2), 18px (H3)
- Line-height: 1.2

**Body:** Inter (or similar sans-serif)
- Font-weight: 400 (regular), 600 (semibold)
- Sizes: 14px (body), 12px (caption)
- Line-height: 1.6

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px

### Border Radius
- sm: 4px
- md: 8px
- lg: 12px
- full: 9999px

---

## Component Updates

### Cards
**Before:** Simple white borders, minimal visual hierarchy
**After:**
- Background: Surface dark (#1A1F29)
- Border: 1px solid rgba(79, 142, 247, 0.1)
- Border-radius: 12px
- Padding: 24px
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
- Hover: Border color becomes rgba(79, 142, 247, 0.3)

### Buttons
**Primary Button:**
- Background: #4F8EF7
- Text: #FFFFFF
- Padding: 10px 20px
- Border-radius: 8px
- Font-weight: 600
- Hover: Background #3D7BE4, Shadow 0 8px 20px rgba(79, 142, 247, 0.3)
- Active: Scale 0.98

**Secondary Button:**
- Background: transparent
- Border: 1px solid #4F8EF7
- Text: #4F8EF7
- Hover: Background rgba(79, 142, 247, 0.1)

### Progress Bars
**Style:**
- Height: 8px
- Border-radius: 4px
- Background: rgba(79, 142, 247, 0.1)
- Fill: Gradient from #4F8EF7 to #10A981
- Animation: Smooth transition on value change

### Badge
**Style:**
- Padding: 4px 12px
- Border-radius: 20px
- Font-size: 12px
- Font-weight: 600
- Background: rgba(79, 142, 247, 0.15)
- Text: #4F8EF7

---

## Page Layout Updates

### Dashboard/Progress Page

#### Header Section
```
┌─────────────────────────────────────────┐
│  Progress Tracker                       │
│                                         │
│  [ 6.5 ]  Day 12 of 60 · 80% to go     │
│  Estimated  ████████░░  Overall Progress│
│  Band       Day 1 ─────────── Day 60   │
└─────────────────────────────────────────┘
```

**Key Changes:**
- Large band score in serif font (56px, #4F8EF7)
- Dynamic progress text with real data
- Animated progress bar
- Clear visual hierarchy

#### Skills Section
```
┌──────────────────┐
│ Skills Breakdown │
│                  │
│ Listening  [7.0] │ ████████░  77%
│ Reading    [6.5] │ ███████░░  72%
│ Writing    [6.0] │ ██████░░░  66%
│ Speaking   [6.5] │ ███████░░  72%
└──────────────────┘
```

**Key Changes:**
- Color-coded bars by skill
- Percentage indicators
- Better visual balance

### Student Management Page

#### Student List
```
┌──────────────────────────────────────┐
│ ● Student Name                 [...]  │
│ email@example.com              [...] │
│ 150 pts · 7 day streak · Plan: None  │
└──────────────────────────────────────┘
```

**Key Changes:**
- Avatar initial circle (36px)
- Better spacing
- Inline metrics display
- Hover: subtle background change

#### Student Profile Modal
**Layout:**
- Modal width: 500px
- Tab navigation at top (Info | Plan | Password)
- Form fields with clear labels
- Action buttons at bottom (Save | Cancel)

**Info Tab:**
- Name field
- Zoom link field
- Weak areas multi-select
- Estimated score display

**Plan Tab:**
- Current plan display
- Plan dropdown with search
- "Save Plan Assignment" button

---

## Navigation/Sidebar Updates

### Current Issues
- No visual distinction between admin/teacher/student
- Lack of hover states
- Icons and text could be better aligned

### New Design
**Sidebar Styling:**
- Width: 240px (collapsible on mobile)
- Background: Linear gradient #1A1F29 to #151A23
- Item hover: Background rgba(79, 142, 247, 0.1)
- Active item: Background #4F8EF7 with left border accent

**Navigation Items:**
```
  ⊞ Dashboard
  👥 Students          ← Active (highlighted)
  📋 Plans
  📊 Reports
  ⚙️ Settings
```

---

## Dark Mode Considerations

**Current Status:** App uses dark theme already
**Improvements:**
- More consistent background usage
- Better contrast ratios (WCAG AA+)
- Subtle borders instead of heavy shadows
- Reduced eye strain with adjusted blues

---

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Full-width cards
- Bottom sheet modals instead of center
- Collapsible sidebar
- Touch-friendly buttons (48px min height)

### Tablet (768px - 1024px)
- Two column grid
- Optimized card widths
- Flexible sidebar

### Desktop (> 1024px)
- Full three-column layout
- Sidebar always visible
- Multi-panel views

---

## Animation Guidelines

**Transitions:**
- Hover states: 200ms ease-out
- Page transitions: 300ms fade + slide
- Progress bar: 1000ms ease-in-out
- Modal open: 200ms scale + fade

**Principles:**
- Keep animations snappy (< 400ms)
- Use ease-out for exits, ease-in for entries
- Avoid distracting animations
- Respect prefers-reduced-motion

---

## Accessibility Checklist

- [ ] Min color contrast ratio 4.5:1 for text
- [ ] Interactive elements 48px minimum touch target
- [ ] Keyboard navigation for all interactive elements
- [ ] Focus indicators visible (minimum 2px outline)
- [ ] Form labels associated with inputs
- [ ] ARIA labels for icon-only buttons
- [ ] Error messages clear and specific
- [ ] Loading states indicated
- [ ] Notifications announced to screen readers

---

## Implementation Priority

**Phase 1 (High Impact):**
1. Update card styling (borders, shadows, padding)
2. Improve button states (hover, active, disabled)
3. Fix progress bar animations
4. Update badge styling

**Phase 2 (Medium Impact):**
1. Refresh sidebar navigation
2. Improve modal layouts
3. Update form styling
4. Add hover states to all interactive elements

**Phase 3 (Polish):**
1. Add animations and transitions
2. Implement responsive refinements
3. Add dark mode tweaks
4. Accessibility audit and fixes

