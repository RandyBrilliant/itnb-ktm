# Design System Specification: Institutional Prestige

## 1. Overview & Creative North Star
**The Creative North Star: "The Academic Editorial"**

This design system transitions the "IT&B" institutional identity from a static physical card to a dynamic, high-end digital experience. We move beyond generic administrative portals to create a system that feels like a premium academic journal—authoritative, crisp, and meticulously organized.

The system is defined by its **Intentional Asymmetry**. We utilize the "Sidebar Motif" not just as a navigation element, but as a structural anchor that provides high-contrast tension against expansive white space. By leveraging sharp geometries (0px to 8px radii) and a hierarchy driven by bold typography, we ensure the interface feels "built," not just "rendered."

---

## 2. Colors
Our palette is rooted in the "IT&B Primary Red" to convey authority, balanced by a neutral spectrum that provides "breathable" luxury.

### Core Palette
*   **Primary (`#af0f24`):** Use for the signature sidebar, primary CTAs, and critical brand moments. 
*   **Primary Container (`#d32f39`):** A slightly more vibrant variant used for hover states and subtle gradients to provide "soul" to flat surfaces.
*   **Surface (`#f9f9f9`):** The default background. A cool, gallery-white that prevents eye strain while maintaining high contrast.
*   **On-Surface (`#1a1c1c`):** Deep charcoal for body text, ensuring maximum legibility without the harshness of pure black.

### The "No-Line" Rule
To achieve a premium editorial feel, **1px solid borders are strictly prohibited** for sectioning content. Visual boundaries must be established through:
1.  **Tonal Shifts:** Placing a `surface_container_low` (`#f3f3f3`) card on a `surface` (`#f9f9f9`) background.
2.  **Negative Space:** Using a strict 8px-based spacing grid to define grouping.

### The Glass & Gradient Rule
For floating elements (modals, dropdowns), use **Glassmorphism**. Apply `surface_container_lowest` (`#ffffff`) at 80% opacity with a `24px` backdrop-blur. This ensures the primary red sidebar or background content bleeds through softly, integrating the layers.

---

## 3. Typography
We use a dual-font strategy to balance institutional weight with modern digital clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. 
    *   *Role:* High-impact titles and the "IT&B" brand presence. 
    *   *Usage:* `display-lg` (3.5rem) should be used sparingly for hero statements to evoke a "magazine cover" feel.
*   **Title & Body (Inter):** A workhorse for readability.
    *   *Role:* All functional data, labels, and long-form content.
    *   *Usage:* Bold `title-md` (1.125rem) mimics the clear, high-contrast labels found on the physical ID card (e.g., Name, Student ID).

**Hierarchy Principle:** Use the `primary` red token for `label-md` elements to create a clear "Field Name" vs "Data" distinction, mirroring the red sub-headers on the student ID card.

---

## 4. Elevation & Depth
Depth in this system is "Physical" rather than "Digital." We treat the UI as a stack of fine cardstock.

*   **The Layering Principle:** 
    *   Base: `surface` (`#f9f9f9`)
    *   Secondary Sections: `surface_container_low` (`#f3f3f3`)
    *   Interactive Cards: `surface_container_lowest` (`#ffffff`)
*   **Ambient Shadows:** Avoid standard drop shadows. If an element must float, use a shadow color tinted with the primary hue: `rgba(175, 15, 36, 0.04)` with a `32px` blur and `0px` offset.
*   **The Ghost Border Fallback:** For accessibility on input fields, use `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### The Signature Sidebar
The hallmark of the system. A solid `primary` (`#af0f24`) vertical bar on the far left. It should contain vertical typography (using `display-sm`) for the page category, just as the card displays "STUDENT ID CARD" rotated.

### Buttons
*   **Primary:** Solid `primary` with `on_primary` text. Sharp corners (`radius-sm`: 2px). 
*   **Secondary:** Ghost style. No border; background is `surface_container_high`. Text is `on_surface`.
*   **Action Gradient:** For high-conversion CTAs, use a subtle linear gradient from `primary` to `primary_container` (top-left to bottom-right).

### Data Cards
Reflect the student card layout.
*   **Style:** `surface_container_lowest` background.
*   **Header:** `label-md` in `primary` red.
*   **Data:** `title-lg` in `on_surface` (Inter Bold).
*   **Separation:** Use a 48px vertical margin instead of a divider line.

### Input Fields
*   **Style:** Minimalist. A bottom-only "Ghost Border" using `outline_variant`.
*   **Focus State:** The bottom border transforms into a 2px `primary` red line.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use extreme vertical rhythm. Give headings 2x the space you think they need.
*   **DO** use the `primary` red for semantic importance (labels, active nav states).
*   **DO** maintain sharp 0px or 4px corners on large containers to preserve the institutional "crispness."

### Don't:
*   **DON'T** use 1px grey borders to separate list items; use a `surface_variant` background shift on hover instead.
*   **DON'T** use rounded "pill" buttons. They conflict with the card’s professional, sharp-edged aesthetic.
*   **DON'T** use generic "Material Blue" for links. All interactive highlights must stem from the `primary` red or `secondary` charcoal.
---

## 7. Role-Based Dashboard Implementations

This design system is implemented across four primary role dashboards. Each maintains design consistency while adapting content to role-specific needs:

### **Student Dashboard**
*   **Primary Content:** Academic performance (GPA, credits), class schedule, student ID card
*   **Navigation:** Dashboard, ID, Certificates, News, Perks
*   **Key Metrics:** GPA trend, credit progress, upcoming classes
*   **Reference:** HTML mockup provided in initial design file

### **Staff Dashboard**
*   **Primary Content:** Key metrics (active users, published posts), pending approvals, system health
*   **Navigation:** Dashboard, Users, Content, Reports, Settings
*   **Key Metrics:** User count, content published, pending reviews
*   **View:** [STAFF_DASHBOARD.html](STAFF_DASHBOARD.html)

### **Lecturer Dashboard**
*   **Primary Content:** Class overview, enrollment, pending grading, course schedule
*   **Navigation:** Dashboard, Classes, Students, Grades, Resources
*   **Key Metrics:** Active classes, student count, pending assignments
*   **View:** [LECTURER_DASHBOARD.html](LECTURER_DASHBOARD.html)

### **Alumni Dashboard**
*   **Primary Content:** Alumni network, job opportunities, events, professional connections
*   **Navigation:** Dashboard, Profile, Events, Jobs, Network
*   **Key Metrics:** Network size, job matches, profile views
*   **View:** [ALUMNI_DASHBOARD.html](ALUMNI_DASHBOARD.html)

**For detailed specifications on all role dashboards, see:** [ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md)

---

## 8. Implementation Roadmap

### Phase 1: Foundation
1. Create base component library:
   - `<Header />` - Top app bar with menu/profile
   - `<PageHeader />` - Sidebar motif + headline
   - `<Button />` - Primary & secondary variants
   - `<Card />` - Base card component

### Phase 2: Shared Components
1. Build reusable components:
   - `<RoleCard />` - Dynamic ID card for all roles
   - `<StatCard />` - Metric card with trend indicator
   - `<ContentCard />` - List item card component
   - `<BottomNav />` - Dynamic role-based navigation

### Phase 3: Dashboard Implementation
1. Build Student Dashboard (reference for others)
2. Adapt Staff Dashboard component tree
3. Adapt Lecturer Dashboard component tree
4. Adapt Alumni Dashboard component tree

### Phase 4: Integration
1. Implement navigation routing between dashboards
2. Add route guards based on JWT user role
3. Integrate with backend API
4. Add loading states and error handling
5. Performance optimization (lazy loading, code splitting)

### Phase 5: Polish
1. Add dark mode support (CSS custom properties)
2. Implement animations and transitions
3. Test responsive behavior (tablet/desktop views)
4. Accessibility audit and fixes
5. Cross-browser testing

---

## 9. Future Enhancements

*   **Dark Mode:** Extend color system with dark variants
*   **Tablet/Desktop:** Expand responsive design for larger screens
*   **Animations:** Add micro-interactions (hover, loading, transitions)
*   **Customization:** Allow users to customize dashboard layout
*   **Real-time Updates:** WebSocket integration for live data updates
*   **Notifications:** Toast system with role-specific notification types
*   **Search:** Global search with role-aware result filtering
*   **Export/Print:** PDF generation for reports and transcripts