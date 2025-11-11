# Design Guidelines: Discord Class Notifier Dashboard

## Design Approach

**Selected Framework**: Modern Dashboard Design System with Discord-inspired aesthetics

This productivity tool requires clear information hierarchy and efficient workflows. The design will draw inspiration from Linear's clean interface, Discord's familiar aesthetics, and Vercel's dashboard patterns - prioritizing clarity, quick scanning, and intuitive interactions.

---

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (default theme):
- Background Base: 220 13% 9% (deep slate)
- Surface: 220 13% 13% (elevated cards)
- Surface Hover: 220 13% 16%
- Border: 220 13% 20%
- Primary Accent: 235 85% 65% (Discord-inspired blue)
- Success: 142 71% 45% (class active indicator)
- Warning: 38 92% 50% (upcoming class alerts)
- Danger: 0 84% 60% (delete actions)
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%

**Light Mode** (optional toggle):
- Background: 0 0% 100%
- Surface: 220 13% 95%
- Text: Inverted from dark mode

### B. Typography

**Font Stack**: 
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Monospace (for times/IDs): `'Roboto Mono', 'Courier New', monospace`

**Hierarchy**:
- Hero/Dashboard Title: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Metadata/Times: text-sm font-medium (14px)
- Timestamps: text-xs text-muted (12px)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 for consistency
- Component padding: p-6 to p-8
- Section gaps: gap-6 to gap-8
- Card margins: space-y-4
- Form field spacing: space-y-6

**Grid Structure**:
- Dashboard: Two-column layout on desktop (sidebar + main content)
- Sidebar: Fixed 280px width with navigation
- Main: max-w-7xl with responsive padding
- Schedule Grid: 7-column grid for weekdays (responsive to 1-column mobile)

### D. Component Library

**Navigation Sidebar**:
- Fixed left sidebar with logo, navigation items, admin status indicator
- Active state: Primary accent background with subtle glow
- Icons: Heroicons outline style

**Schedule Cards**:
- Elevated surface with subtle border
- Course number badge (small pill with muted background)
- Time display in monospace font
- Google Meet link as primary button
- Hover state: Subtle lift with shadow-lg

**Admin Forms**:
- Clean input fields with focus rings (ring-2 ring-primary)
- Time picker: Segmented controls for hour/minute/AM-PM
- Day selector: Button group toggle
- Action buttons: Primary (save), Secondary (cancel), Danger (delete)

**Force Announce Panel**:
- Prominent card with warning color accent
- Preview of announcement before sending
- Confirmation modal with Discord embed preview

**Data Tables** (for list views):
- Sticky header with sort indicators
- Row hover: Background surface-hover
- Zebra striping for better scanning
- Action column with icon buttons (edit, delete)

**Calendar Grid View**:
- Week layout with day columns
- Time slots as rows
- Class cards positioned in grid
- Current day/time highlighted
- Empty states with "Add Class" CTAs

### E. Interactions & States

**Minimal Animations**:
- Page transitions: Fade in with duration-200
- Card hovers: Scale 1.01 with shadow change
- Button clicks: Scale 0.98 feedback
- Modal entry: Slide up with backdrop fade
- NO complex scroll animations or parallax effects

**States**:
- Loading: Skeleton screens matching layout
- Empty: Centered illustration with CTA
- Error: Inline alerts with retry actions
- Success: Toast notifications (top-right)

---

## Key Screens Layout

### 1. Public Schedule View
- No sidebar, full-width calendar grid
- Header with logo and "Admin Login" button (top-right)
- Week navigation controls
- Read-only class cards with visual time indicators

### 2. Admin Dashboard
- Left sidebar: Navigation (Dashboard, Schedule, Settings, Force Announce)
- Main: Statistics cards (upcoming classes, today's schedule)
- Quick action buttons: Add Class, Force Announce
- Weekly overview with edit controls

### 3. Admin Login
- Centered modal overlay
- Simple password field with "Login" CTA
- Minimalist design with brand accent

### 4. Force Announce Panel
- Form to select day/class or custom message
- Live preview of Discord embed
- "Send Now" button with confirmation
- Recent announcements history

---

## Visual Consistency Notes

- **Buttons**: Primary actions use accent color with white text; secondary use outline style
- **Cards**: Consistent 8px border-radius with subtle shadow
- **Focus States**: 2px ring with primary color for keyboard navigation
- **Icons**: 20px size for UI elements, 24px for headers
- **Badges**: Small pills with uppercase text for course codes
- **Dividers**: Use border-t with border color for section separation

---

## Accessibility & UX

- High contrast ratios (WCAG AA minimum)
- All interactive elements minimum 44px touch targets
- Keyboard navigation with visible focus indicators
- Screen reader labels for icon-only buttons
- Error messages with clear resolution steps
- Confirmation dialogs for destructive actions (delete, force announce)

---

## Images & Assets

**Hero/Branding**:
- No large hero image needed (utility dashboard)
- Logo/icon: Discord-style bot avatar (64px) in sidebar header
- Empty state illustrations: Simple line art for "no classes scheduled"

**Icons**: Use Heroicons CDN (outline variant) for:
- Navigation: CalendarIcon, BellIcon, CogIcon, LightningBoltIcon
- Actions: PlusIcon, PencilIcon, TrashIcon, EyeIcon
- Status: CheckCircleIcon, ExclamationIcon, ClockIcon