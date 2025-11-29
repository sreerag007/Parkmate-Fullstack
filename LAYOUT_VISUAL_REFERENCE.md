# 2-Column Layout - Visual Reference & Quick Guide

## Layout Structure

### Desktop View (≥768px)
```
┌─────────────────────────────────────────────────────────────────┐
│                      CONFIRMATION HEADER                         │
│                      ✅ Booking Confirmed                        │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────┬─────────────────────────────────────┐
│   LEFT COLUMN (STICKY)     │    RIGHT COLUMN (SCROLLABLE)        │
│   └─ Summary Section       │    └─ Details Section               │
│   ┌──────────────────────┐ │    ┌────────────────────────────┐   │
│   │ 📍 BOOKING SUMMARY   │ │    │ 💳 PAYMENT BREAKDOWN       │   │
│   ├──────────────────────┤ │    ├────────────────────────────┤   │
│   │ Lot: Lot 3           │ │    │ ┌────────────────────────┐ │   │
│   │ Slot: #A1            │ │    │ │ 🅿️ Slot Payment        │ │   │
│   │ Vehicle: MH01AB1234  │ │    │ │ Amount: ₹100.00        │ │   │
│   └──────────────────────┘ │    │ │ Status: ✅ Success     │ │   │
│   ┌──────────────────────┐ │    │ └────────────────────────┘ │   │
│   │ TOTAL: ₹150.00       │ │    │ ┌────────────────────────┐ │   │
│   │ (Slot + Car Wash)    │ │    │ │ 🧼 Car Wash Payment    │ │   │
│   └──────────────────────┘ │    │ │ Amount: ₹50.00         │ │   │
│   ┌──────────────────────┐ │    │ │ Status: ✅ Success     │ │   │
│   │ ⏱️ TIME REMAINING     │ │    │ └────────────────────────┘ │   │
│   │ 45:32                │ │    ├────────────────────────────┤   │
│   │ Expiring soon!       │ │    │ 🧼 CAR WASH SERVICE        │   │
│   └──────────────────────┘ │    ├────────────────────────────┤   │
│   (Position: STICKY)       │    │ Service: Premium Wash      │   │
│   (Stays visible on scroll) │    │ Price: ₹50.00              │   │
└────────────────────────────┴─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  💡 Your booking will automatically expire in 1 hour.            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Add Car Wash] [Renew Now] [Return to Home]                    │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View (<768px)
```
┌──────────────────────────────┐
│   CONFIRMATION HEADER        │
│   ✅ Booking Confirmed       │
└──────────────────────────────┘

┌──────────────────────────────┐
│  📍 BOOKING SUMMARY          │
├──────────────────────────────┤
│ Lot: Lot 3                   │
│ Slot: #A1                    │
│ Vehicle: MH01AB1234          │
└──────────────────────────────┘

┌──────────────────────────────┐
│ TOTAL: ₹150.00               │
│ (Slot + Car Wash)            │
└──────────────────────────────┘

┌──────────────────────────────┐
│ ⏱️ TIME REMAINING             │
│ 45:32                        │
│ Expiring soon!               │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 💳 PAYMENT BREAKDOWN         │
├──────────────────────────────┤
│ ┌────────────────────────┐   │
│ │ 🅿️ Slot Payment        │   │
│ │ Amount: ₹100.00        │   │
│ │ Status: ✅ Success     │   │
│ └────────────────────────┘   │
│ ┌────────────────────────┐   │
│ │ 🧼 Car Wash Payment    │   │
│ │ Amount: ₹50.00         │   │
│ │ Status: ✅ Success     │   │
│ └────────────────────────┘   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🧼 CAR WASH SERVICE          │
├──────────────────────────────┤
│ Service: Premium Wash        │
│ Price: ₹50.00                │
└──────────────────────────────┘

┌──────────────────────────────┐
│ [Add Car Wash]               │
│ [Renew Now]                  │
│ [Return to Home]             │
└──────────────────────────────┘
```

---

## CSS Class Hierarchy

```
.booking-confirmation
└── .confirmation-container
    ├── .confirmation-header
    │   ├── h1 (title)
    │   └── .subtitle
    │
    ├── .grid (2-column responsive grid)
    │   ├── .md:col-span-1 (LEFT: 1 column)
    │   │   └── .summary-section (STICKY)
    │   │       ├── .summary-header
    │   │       ├── .quick-info-card
    │   │       │   └── .quick-info-item (repeating)
    │   │       ├── .total-card
    │   │       │   ├── .total-card-label
    │   │       │   ├── .total-card-amount
    │   │       │   └── .total-card-desc
    │   │       └── .timer-card (or .timer-card.expiring)
    │   │           ├── .timer-card-label
    │   │           ├── .timer-card-time
    │   │           ├── .timer-card-desc
    │   │           └── .timer-card-warning
    │   │
    │   └── .md:col-span-2 (RIGHT: 2 columns)
    │       └── .details-section
    │           ├── .details-card.payment-section
    │           │   ├── .section-header
    │           │   └── .payments-container
    │           │       └── .payment-card (repeating)
    │           │           ├── .payment-card-header
    │           │           │   ├── .payment-type-badge
    │           │           │   └── .payment-status-badge
    │           │           └── .payment-card-content
    │           │               └── .payment-detail (repeating)
    │           │
    │           └── .details-card.carwash-section
    │               ├── .section-header
    │               └── .carwash-detail-card
    │                   └── .detail-row (repeating)
    │
    ├── .booking-info
    ├── .action-buttons
    └── button (various)
```

---

## Color Palette

### Gradient Cards
```
Total Card:
  From: #ecfdf5 (Emerald 50)
  To:   #d1fae5 (Emerald 200)
  Border: #6ee7b7 (Emerald 400)
  Text: #059669 (Emerald 600)

Timer Card (Normal):
  From: #eff6ff (Blue 50)
  To:   #dbeafe (Blue 200)
  Border: #93c5fd (Blue 400)
  Text: #1e3a8a (Blue 900)

Timer Card (Expiring):
  From: #fef2f2 (Red 50)
  To:   #fee2e2 (Red 200)
  Border: #f87171 (Red 400)
  Text: #dc2626 (Red 600)

Car Wash Section:
  Background: #fef9e7 (Amber 50)
  Border: #fcd34d (Amber 300)
  Text: #92400e (Amber 900)
```

### Status Badges
```
Success: #d1fae5 (Emerald 200) / #065f46 (Emerald 900)
Pending: #fef3c7 (Amber 200) / #92400e (Amber 900)
Failed:  #fee2e2 (Red 200) / #991b1b (Red 900)
```

---

## Responsive Behavior

### Grid System
```
Mobile (<768px):
  grid-template-columns: 1fr
  Display: Single column stacked

Desktop (≥768px):
  grid-template-columns: repeat(3, 1fr)
  Column Distribution:
    Left:  .md:col-span-1 (1 column, sticky)
    Right: .md:col-span-2 (2 columns, scrollable)
```

### Sticky Behavior
```
Desktop:
  .summary-section {
    position: sticky;
    top: 20px;
    height: fit-content;
  }
  → Stays visible while scrolling right column

Mobile:
  .summary-section {
    position: static;
  }
  → Scrolls normally with rest of content
```

---

## Component Details

### Summary Section (Left)
**Features**:
- Sticky positioning on desktop
- Contains: Header, Quick Info, Total, Timer
- Width: 33% on desktop, 100% on mobile
- Gap between elements: 16px
- Padding: 24px

**Key Information**:
- Lot name, Slot number, Vehicle number
- Total amount (highlighted in green)
- Remaining time or scheduled time
- Color change when expiring soon

### Details Section (Right)
**Features**:
- Scrollable on desktop
- Contains: Payments, Car Wash details
- Width: 67% on desktop, 100% on mobile
- Gap between cards: 20px

**Payment Cards**:
- Show payment type with emoji
- Display status badge
- Show payment method, amount, transaction ID
- Hover effects for better UX

**Car Wash Section**:
- Golden/amber color scheme
- Show service name, description, price
- Price highlighted

---

## Spacing Reference

```
Grid gap:              24px (desktop), 16px (mobile)
Card padding:          20px
Section gap:           16px
Sticky top offset:     20px
Quick info gap:        10px
Payment detail gap:    8px
Action buttons gap:    12px
Border radius:         8px-12px
Font sizes:            12px-40px
```

---

## Typography Hierarchy

```
Page Title (h1):
  Font: 28px, Bold
  Color: #059669 (Emerald) or #2563eb (Blue)

Section Headers (h3):
  Font: 16px, Bold
  Color: #1f2937

Total Amount:
  Font: 32px, Monospace, Bold
  Color: #059669 (Emerald)

Timer Display:
  Font: 40px, Monospace, Bold
  Color: #1e3a8a (Blue)

Labels:
  Font: 13px, Semi-bold
  Color: #6b7280 (Gray)

Values:
  Font: 13px, Medium
  Color: #111827 (Dark)

Subtitles:
  Font: 13px, Regular
  Color: #9ca3af (Light Gray)
```

---

## Interaction States

### Hover Effects
- Cards: Border color changes + box-shadow increases
- Buttons: Background darkens + slight upward transform
- Payment cards: Subtle shadow enhancement

### Active/Expiring States
- Timer card changes from blue to red gradient
- Warning icon appears
- Text color becomes red (#dc2626)

### Responsive States
- Desktop: Sticky left, scrollable right
- Mobile: Full width, all scrollable, no sticky

---

## Build Output

```
✓ 144 modules transformed
✓ dist/index.html: 0.47 kB (gzip: 0.30 kB)
✓ dist/assets/index-BM9z_ngG.css: 103.73 kB (gzip: 17.57 kB)
✓ dist/assets/index-lcI_watv.js: 474.17 kB (gzip: 133.26 kB)
✓ Build time: 5.53s
```

---

## Testing Checklist

- [ ] Desktop layout displays 2-column grid
- [ ] Left column stays sticky on scroll
- [ ] Right column scrolls independently
- [ ] Total card displays correct amount
- [ ] Timer card shows correct time
- [ ] Payment cards display all information
- [ ] Car wash section shows service details
- [ ] Mobile layout displays single column
- [ ] Mobile sticky is removed (position: static)
- [ ] All buttons are clickable
- [ ] Status badges display with correct colors
- [ ] Timer changes color when expiring
- [ ] Responsive breakpoint at 768px
- [ ] No layout shifts or overlapping elements
- [ ] All text is readable
- [ ] All colors are visible and distinct

---

## File References

**Modified Files**:
1. `src/Pages/Users/BookingConfirmation.jsx` (Lines 307-605)
2. `src/Pages/Users/BookingConfirmation.scss` (Complete rewrite)

**Build Commands**:
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Preview URL**:
```
http://localhost:4173/
```
