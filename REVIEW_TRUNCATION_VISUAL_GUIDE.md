# Review Text Truncation - Visual & Technical Guide

## 🎨 User Interface Flow

### Admin/Owner Reviews Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Customer Reviews Dashboard                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Statistics: 6 Total Reviews | 4.2⭐ Average Rating     │
│                                                              │
│  [Filter by Lot ▼] [Filter by Rating ▼] [Sort ▼]          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Customer │ Lot │ Rating │ Review                   │Date│
│  ├──────────────────────────────────────────────────────┤  │
│  │ John D. │Park1│ ⭐⭐⭐⭐⭐│ This is an excellent lot ... │Dec 1│
│  │        │    │ (5/5)   │ [Read More]               │    │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Sarah M.│Park2│ ⭐⭐⭐⭐ │ Good location, safe and well│Dec 1│
│  │        │    │ (4/5)   │ [Read More]               │    │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Mike T. │Park1│ ⭐⭐⭐⭐⭐│ Fantastic service, would rec │Dec 1│
│  │        │    │ (5/5)   │ [Read More]               │    │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Component Interaction

### ReviewText Component State Flow

```
┌─────────────────────────────────────────────────┐
│ ReviewText Component                             │
├─────────────────────────────────────────────────┤
│                                                  │
│  Props:                                         │
│  • text: "This is a long review..."            │
│  • maxLength: 100                               │
│  • onOpenModal: callback function               │
│                                                  │
│  Initial State:                                 │
│  • isExpanded: false                            │
│                                                  │
├─────────────────────────────────────────────────┤
│ Display                                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  Text Length ≤ 80?                             │
│         ↓                                        │
│      [NO] → Show truncated + "..."              │
│      [YES] → Show full text (no button)         │
│                                                  │
│  Text Length > 300?                            │
│         ↓                                        │
│      [YES] → "View Full Review" button          │
│               (opens modal on click)             │
│      [NO]  → "Read More" button                 │
│              (inline expand on click)            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Modal Opening Flow

```
┌──────────────────────────────────────┐
│ Review List (Admin/Owner View)        │
└──────────────────────────────────────┘
                ↓
        [Click "View Full Review"]
                ↓
    ┌─────────────────────────────┐
    │ setSelectedReview(review)    │
    │ setIsModalOpen(true)         │
    └─────────────────────────────┘
                ↓
    ┌─────────────────────────────────────────┐
    │ <ReviewModal isOpen={true} />            │
    │                                          │
    │ ┌─────────────────────────────────────┐ │
    │ │ Full Review          [X]             │ │
    │ ├─────────────────────────────────────┤ │
    │ │ 👤 John Doe          |  Dec 1, 2025 │ │
    │ ├─────────────────────────────────────┤ │
    │ │ Lot: Main Parking A | ⭐⭐⭐⭐⭐ (5) │ │
    │ ├─────────────────────────────────────┤ │
    │ │ This is an excellent parking lot... │ │
    │ │                                     │ │
    │ │ Spaces are clean and well-maint... │ │
    │ │ Security is great and staff is...  │ │
    │ │                                     │ │
    │ ├─────────────────────────────────────┤ │
    │ │                             [Close] │ │
    │ └─────────────────────────────────────┘ │
    └─────────────────────────────────────────┘
                ↓
        [Click "Close" or X]
                ↓
    setIsModalOpen(false)
                ↓
    Modal closes, return to list
```

---

## 🎯 Text Truncation Logic

```javascript
// ReviewText Component Logic

const text = "This is a very long review that exceeds the maximum length..."
const maxLength = 120
const [isExpanded, setIsExpanded] = useState(false)

// Decision Tree:
if (text.length === 0) {
  // Show: "No review provided"
} else if (text.length <= maxLength) {
  // Show: Full text (no button)
} else {
  // text.length > maxLength
  displayText = isExpanded ? text : text.substring(0, maxLength) + "..."
  
  if (text.length > 300) {
    // Show: "View Full Review" (opens modal)
    button = "View Full Review"
    onClick = onOpenModal()
  } else {
    // Show: "Read More" / "Show Less" (inline expand)
    button = isExpanded ? "Show Less" : "Read More"
    onClick = setIsExpanded(!isExpanded)
  }
}
```

---

## 🎨 CSS Classes Hierarchy

```
.review-text-container
├── p (review text)
│   ├── Text content
│   └── "..." (when truncated)
├── button (Read More / View Full Review)
│   ├── svg (MessageSquareText icon)
│   └── Text label

.review-modal
├── .modal-overlay (background)
├── .modal-content
│   ├── .modal-header (sticky)
│   │   ├── h2
│   │   └── close button
│   ├── .modal-body
│   │   ├── .customer-info
│   │   ├── .review-info
│   │   └── .review-content
│   └── .modal-footer
│       └── close button
```

---

## 🚀 State Management

### AdminReviews Component

```javascript
const AdminReviews = () => {
  // Existing state
  const [reviews, setReviews] = useState([])
  const [filterLot, setFilterLot] = useState('')
  const [filterRating, setFilterRating] = useState('')
  
  // NEW: Modal state for review display
  const [selectedReview, setSelectedReview] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Handler
  const handleViewFullReview = (review) => {
    setSelectedReview(review)
    setIsModalOpen(true)
  }
  
  // In render:
  // <ReviewText
  //   text={review.review_desc}
  //   onOpenModal={() => handleViewFullReview(review)}
  // />
  // 
  // <ReviewModal
  //   isOpen={isModalOpen}
  //   review={selectedReview}
  //   onClose={() => setIsModalOpen(false)}
  // />
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│ Backend API     │
│ /api/reviews/   │
└────────┬────────┘
         │
         ↓
    [API Response]
    {
      rev_id: 1,
      review_desc: "Long review text...",
      user_detail: { firstname, lastname },
      lot_detail: { lot_id, lot_name },
      rating: 5,
      created_at: "2025-12-01"
    }
         │
         ↓
┌──────────────────────────────────┐
│ AdminReviews / OwnerReviews       │
│ setState(reviews)                 │
└──────────────────────────────────┘
         │
         ↓
    {reviews.map(review => 
        <ReviewText text={review.review_desc} />
    )}
         │
         ├──→ [User clicks "Read More"]
         │           ↓
         │    [setSelectedReview(review)]
         │    [setIsModalOpen(true)]
         │           ↓
         │    <ReviewModal review={review} />
         │
         └──→ [Modal displays full data]
              - review.review_desc (full)
              - review.user_detail
              - review.lot_detail
              - review.rating
              - review.created_at
```

---

## 🎯 Responsive Behavior

```
DESKTOP (1024px+)
┌──────────────────────────────────────────┐
│ Customer    │ Lot      │ Rating │ Review   │
│ John Doe    │ Parking A│ ⭐⭐⭐⭐⭐│ This is... │
│             │          │ (5/5)  │ [Read More]│
└──────────────────────────────────────────┘
  Preview: 120 chars
  Modal Width: 672px


TABLET (640-1024px)
┌───────────────────────────────────────┐
│ Customer    │ Lot     │ Rating│ Review  │
│ John Doe    │ Park A  │ ⭐⭐⭐⭐⭐│ This... │
│             │         │ (5/5) │ [Read] │
└───────────────────────────────────────┘
  Preview: 100 chars
  Modal Width: 90vw


MOBILE (<640px)
┌──────────────────────────┐
│ Customer: John Doe       │
│ Lot: Parking A           │
│ Rating: ⭐⭐⭐⭐⭐ (5/5)   │
│ Review: This is... [Rd More]
└──────────────────────────┘
  Preview: 80 chars
  Modal: Full width
```

---

## ♿ Accessibility Features

```
Keyboard Navigation:
  TAB → Tab through buttons
  ENTER → Open modal / Toggle expand
  ESC (in modal) → Close modal (with proper handler)

Focus Indicators:
  Visible: 2px solid #2563eb outline
  Offset: 2px
  Color Contrast: WCAG AA compliant

ARIA Attributes:
  <button aria-expanded={isExpanded}>
    Read More
  </button>

Screen Reader:
  "Read More, button"
  "View Full Review, button"
  "Close modal, button"
```

---

## 🔧 Configuration Options

```javascript
// Default maxLength
<ReviewText text={review} maxLength={120} />

// Custom preview length
<ReviewText text={review} maxLength={80} />

// Mobile-specific
<ReviewText 
  text={review} 
  maxLength={window.innerWidth < 640 ? 50 : 120}
/>

// Without modal callback (inline only)
<ReviewText 
  text={review} 
  onOpenModal={null}
/>
```

---

## 📋 Implementation Checklist

- [x] ReviewText component created
- [x] ReviewModal component created
- [x] AdminReviews updated
- [x] OwnerReviews updated
- [x] Styling added to Reviews.scss
- [x] Responsive design implemented
- [x] Accessibility features added
- [x] Error handling for edge cases
- [x] Icon integration (Lucide)
- [x] State management proper
- [x] No breaking changes
- [x] All components error-free
- [x] Vite hot reload working

---

## 🎓 Code Snippets

### Using ReviewText
```jsx
import ReviewText from '../Components/ReviewText'

<td>
  <ReviewText
    text={review.review_desc}
    maxLength={100}
    onOpenModal={() => {
      setSelectedReview(review)
      setIsModalOpen(true)
    }}
  />
</td>
```

### Using ReviewModal
```jsx
import ReviewModal from '../Components/ReviewModal'

<ReviewModal
  isOpen={isModalOpen}
  review={selectedReview}
  onClose={() => {
    setIsModalOpen(false)
    setSelectedReview(null)
  }}
/>
```

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Status:** ✅ Complete and Tested
