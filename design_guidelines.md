# Ascendia - Malaysian Scholarship Platform Design Guidelines

## Design Approach
**Utility-Focused Application**: This is a data-driven scholarship discovery platform prioritizing information clarity and efficient browsing over decorative elements.

## Brand Identity

**Header/Branding**
- Site name: "Ascendia" displayed in Indigo-600 (use a modern, professional font weight)
- Tagline: "Malaysia's Premier Opportunity Navigator" as subtitle
- Clean, professional header layout

## Typography Hierarchy

**Primary Text Elements**
- Scholarship titles: Bold weight for immediate recognition
- Provider names: Gray text for secondary information hierarchy
- Amount values: Green text to emphasize financial value
- Deadlines: Red text when approaching deadline (visual urgency indicator)

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, and 8 for consistent spacing (p-4, m-6, gap-8)

**Grid Layout**
- Responsive card grid for scholarship listings
- Desktop: 3-column grid
- Tablet: 2-column grid  
- Mobile: Single column stack

## Component Library

**Scholarship Cards**
- Top-right badge: Education level indicator (e.g., "Undergraduate", "Postgraduate")
- Card structure from top to bottom:
  - Education level badge (positioned top-right)
  - Scholarship title (bold, prominent)
  - Provider name (gray, subdued)
  - Amount display (green, emphasized - e.g., "RM 10,000")
  - Deadline date (red text for urgency when applicable)
  - "Apply Now" call-to-action button (bottom of card)

**Loading State**
- Display message: "Sedang memuatkan..." (Malaysian Malay for "Loading...")
- Show while fetching data from backend

**Error State**
- Clear error message when API connection fails
- User-friendly fallback messaging

## Color Semantics

**Functional Colors** (specific to data display)
- Indigo-600: Brand/header color
- Green: Monetary amounts (positive association)
- Red: Urgent deadlines (warning/attention)
- Gray: Secondary information (provider details)

## Visual Treatment

**Card Design**
- Clean borders with subtle shadows
- Adequate padding for readability
- Clear visual separation between cards
- Badge treatment: Distinct from card body, easily scannable

**No Hero Section**: This is a data-focused application - lead directly with the branded header and scholarship grid.

## Accessibility
- Ensure color contrast meets WCAG standards for all text elements
- Badge text readable against background
- Button states clearly visible