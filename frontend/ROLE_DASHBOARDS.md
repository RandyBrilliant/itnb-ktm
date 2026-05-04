# Dashboard Designs by Role

Complete design specifications for Student, Staff, Lecturer, and Alumni dashboards following the Institutional Prestige design system.

---

## 1. STUDENT DASHBOARD

### Overview
The Student Dashboard is the entry point for academic engagement. It combines academic performance metrics, class schedule, and quick access to essential resources.

### Key Sections

#### Header & Identity
- **Top Bar:** Fixed header with menu, "IT&B HUB" logo in primary red, profile avatar
- **Page Header:** 
  - Sidebar motif (red vertical bar) + "ACADEMIC YEAR 2023/24" label
  - Bold headline: "Dashboard"
  - Status badge (ACTIVE/INACTIVE)

#### Primary Content

**1. Digital ID Card**
- Large interactive card with primary red background
- Grid pattern overlay (subtle)
- Student info layout:
  - "STUDENT ID CARD" label
  - Full name (bold)
  - Program + level
  - "ID NUMBER" label + student ID
  - Profile photo (top right, monochrome)
  - "INSTITUTE OF TECH & BUSINESS" vertical text (bottom right)
  - "TAP FOR DIGITAL ENTRY" with contactless icon (bottom left)
  - QR code (bottom right)
- Flip action to view transcript

**2. Academic Stats (Bento Grid)**
- **Cumulative GPA**
  - Large number (e.g., 3.84)
  - Trending indicator (up/down + percentage)
- **Total Credits**
  - Large number (e.g., 112)
  - Progress bar showing completion % (e.g., 80% of degree)

**3. Today's Schedule**
- Section header with red sidebar motif
- Class cards showing:
  - Time (large number + AM/PM)
  - Vertical divider
  - Course code + room
  - Course title
  - Forward arrow

**4. Active Campus Session**
- Dark background card
- Security icon in red square
- "ACTIVE CAMPUS SESSION" + WiFi name
- Green sensor icon

#### Bottom Navigation
1. **Dashboard** (active - primary red, scaled up)
2. **ID** (view/manage student card)
3. **Certificates** (view earned certificates)
4. **News** (campus news + announcements)
5. **Perks** (student benefits)

---

## 1.5 STUDENT ID PAGE

### Overview
A dedicated page for viewing and managing the digital student ID card with all identification details, mobile wallet integration, and card-specific features.

### Key Sections

#### Header & Identity
- **Page Header:** Sidebar motif + "ACADEMIC YEAR 2024/25" + "Digital ID" headline
- **Status:** Shows card validity and access level

#### Primary Content

**1. Digital ID Card Display**
- White card background with red sidebar accent
- Institution branding at top
- Centered student photo
- Full name (bold, large)
- Student ID number (monospace)
- Department/Program
- Clear, official layout for easy reference

**2. Mobile Wallet Integration**
- **Apple Wallet Button** - Dark background with wallet icon
- **Google Pay Button** - Light background with credit card icon
- Copy prompt: "ADD TO MOBILE WALLET"
- One-tap addition to device wallet

**3. Emergency Contact**
- Section header with red sidebar motif
- Contact name (e.g., "Sarah Vandenberg")
- Relationship (e.g., "Parent/Guardian")
- Phone icon indicating clickable
- Quick access for campus security

**4. Card Information (Bento Grid)**
- **Library Access Level**
  - Access level (e.g., "Lvl 3")
  - Access type (e.g., "Full Member")
  - Verified checkmark icon
- **Validity/Expiration Date**
  - Large year display (e.g., "2028")
  - Month indicator (e.g., "AUG")
  - Graduation/expiration info

**5. Card Features List**
- Digital Entry Access (tap on campus readers)
- Library Check-out (activate in kiosk)
- Cafeteria Discounts (show digital ID)
- Icons with descriptions

**6. Action Buttons**
- **Download Physical Card** - Primary red, full width
- **Share ID** - Secondary, full width

#### Bottom Navigation
1. **Dashboard** (view dashboard)
2. **ID** (active - primary red)
3. **Certificates** (view certificates)
4. **News** (campus news)
5. **Perks** (student benefits)

#### Design Notes
- Clean, official presentation (like government ID)
- Mobile-first wallet integration
- Quick emergency contact access
- All ID information in one scrollable view
- Easy to reference or share
- Print-friendly layout

---

## 1.6 STUDENT CERTIFICATES PAGE

### Purpose
Displays digital certificates and credentials organized by status (valid, expired), with downloadable documents and request functionality.

### Key Sections

#### 1. Page Header (Sidebar Motif)
- "ACADEMIC RECORDS" label + "Certificates" title
- Red vertical bar (1.5px width)
- Standard 32px top padding

#### 2. Official Credentials Section
- Verified icon + section title (primary color)
- Certificate cards with:
  - Document icon (filled, primary-container color)
  - Status badge ("Valid" - green background)
  - Certificate name + academic context
  - Issue date label + actual date
  - Download button (primary red, 10x10 icon button)
- Example certificates:
  - Enrollment Letter (Academic Year 2023/2024)
  - Dean's List (Semester 5 Excellence Award)

#### 3. Historical Records Section
- History icon + section title (secondary color)
- Compact list items with:
  - Icon + title + description
  - Expired badge (secondary-container background)
- Example records:
  - Internship Completion (Summer 2022)
  - Language Proficiency (Level B2)

#### 4. Support Section
- Light red background (primary-container/5)
- Missing certificate help text
- "Submit Registry Request" button with arrow icon

### Component Patterns
- **Official Credentials Cards:** White surface, shadow, top-justified flex layout, download affordance
- **Historical Records List:** Compact horizontal layout, icon badges, status indicators
- **Section Headers:** Icon + label in uppercase, 12px tracking

### Bottom Navigation
- 5 items: Dashboard, ID, **Certificates (ACTIVE)**, News, Perks
- Active state: Primary red color + 110% scale
- Icon fill: 1 (Material Symbols FILL setting)

### Design Notes
- Consistent spacing: 12px between sections, 6px between cards
- Border styling: 1px horizontal dividers between card sections
- Shadows: Subtle elevation ("0px -4px 32px rgba(175,15,36,0.04)")
- Status badges: Green (#d4edda) for valid, Gray for expired
- Mobile-first: Single column, no horizontal scroll

### Reference File
[STUDENT_CERTIFICATES_PAGE.html](STUDENT_CERTIFICATES_PAGE.html)

---

## 1.7 STUDENT NEWS & EVENTS PAGE

### Purpose
Displays campus news, events, bulletins, and academic calendar in an editorial magazine format with featured stories and upcoming events.

### Key Sections

#### 1. Page Header
- "NEWSFEED" label + "Campus Bulletin" title
- Mobile-friendly flex layout
- Section title with uppercase tracking (0.2em)

#### 2. Featured Editorial Card
- Large hero image (aspect ratio 16:10)
- Hover scale effect (105%)
- Badge: "EDITORIAL" + date
- Headline (24px, bold)
- Excerpt text (13px, secondary color)
- CTA: "Read Full Article" + arrow icon (primary red)
- Shadow elevation with primary red tint

#### 3. Academic Calendar Section
- "Academic Calendar" headline + "View Month" link (primary red)
- Horizontal scrolling calendar cards (no scrollbar):
  - 4 upcoming events (Mar 28 Mid-Term, Apr 02 Workshop, etc.)
  - Active card: Primary red bottom border (4px)
  - Inactive cards: Light background (surface-container-low)
  - Layout: Month, Date (large), Event label
  - Spacing: 16px gap between cards

#### 4. Latest Bulletins List
- 3 categorized bulletin items with thumbnails (16x16 square images):
  - **Campus Life:** New Student Council Elections (2 Hours Ago)
  - **Academics:** Mobile App v2.4 Release Notes (Yesterday)
  - **Events:** Annual Career Fair 2024 (Mar 22)
- Items composition:
  - Left: 4x4 image thumbnail (rounded corners)
  - Center: Category label (primary red, 10px), title (bold, 14px), timestamp (secondary, 10px, material icon)
  - Right: Chevron icon (fades in on hover)
  - Full-width hover state: background shift to surface-container-low

#### 5. Archives Button
- Full-width button
- Background: surface-container-high
- Text: "Archives" + history icon
- Hover: surface-container-highest

### Component Patterns
- **Featured Card:** Large hero image, overlay with content, hover scale
- **Calendar Cards:** Horizontal scroll layout, active state with red border
- **Bulletin Items:** Thumbnail + metadata grid, hover affordance
- **Typography:** Headlines in Manrope, body in Inter

### Bottom Navigation
- 5 items: Dashboard, ID, Certificates, **News (ACTIVE)**, Perks
- Active state: Primary red color + 110% scale
- Icon fill: 1 (Material Symbols FILL setting)

### Design Notes
- Consistent spacing: 32px between sections, 16px between cards
- Shadows: Subtle elevation ("0px -4px 32px rgba(175,15,36,0.04)")
- Hidden scrollbar on calendar: Custom CSS for no-scrollbar
- Magazine-style layout: Large images, clear typography hierarchy
- Image aspect ratios: Featured (16:10), Thumbnails (1:1)
- Category badges: Primary red background, primary container color for secondary badges
- Mobile-first: Single column, horizontal scroll for calendar only

### Reference File
[STUDENT_NEWS_PAGE.html](STUDENT_NEWS_PAGE.html)

---

## 1.8 STUDENT PERKS & BENEFITS PAGE

### Purpose
Showcases exclusive student benefits, discounts, and special perks from institutional partners with searchable, filterable catalog and claim functionality.

### Key Sections

#### 1. Page Header (Sidebar Motif)
- "MEMBER EXCLUSIVE" label + "Perks & Benefits" title
- Red vertical bar (1.5px width)
- Bold, large headline (text-4xl)

#### 2. Search Bar
- Full-width search input with magnifying glass icon
- Placeholder: "Search benefits, brands, or categories..."
- Bottom border focus state (primary red)
- Light background (surface-container-low)
- Icon on left side (outline color)

#### 3. Category Filter Buttons
- Horizontal scrollable buttons (no scrollbar)
- Active: "All Perks" button (primary red background)
- Inactive: surface-container-high background
- Labels: All Perks, Food & Drink, Software, Transport
- Hover effect: background shift on inactive buttons
- 12px tracking on text

#### 4. Featured Perk Card (Full Width)
- Adobe Creative Cloud (Software category)
- Badge: "MOST POPULAR" (primary background, top-left)
- Hero image (16:10 aspect ratio)
- Category label: "SOFTWARE" (primary red, uppercase)
- Title: "Adobe Creative Cloud" (21px, bold)
- Description: "Get 60% off the entire suite..."
- CTA Button: "Claim Access" + arrow icon (primary red, full width, 16px padding)
- Shadow elevation with primary tint

#### 5. 2-Column Perk Grid
- 2 smaller cards in grid layout:
  - **Food & Drink:** "2-for-1 Burgers" (image 16:9, compact layout)
  - **Transport:** "Free Annual Pass" (image 16:9, compact layout)
- Each card: Image, category label, title, "Claim" button (secondary bg)
- Image aspect ratio: 1:1 (square)
- Card height: 128px (image) + 64px (content)

#### 6. Horizontal Perk Card (Full Width)
- Tech perk: "15% Off All Tech"
- Layout: 1/3 image left + 2/3 content right
- Image on left, fixed width
- Text content: Category label, title, description
- 128px fixed height

#### 7. Empty State / Suggestion Box
- Dashed border (outline-variant color)
- Plus circle icon (outline-variant)
- "Missing a Perk?" heading
- "Suggest a new benefit you'd like to see." description
- Centered alignment with padding
- Rounded corners and dashed border

### Component Patterns
- **Featured Card:** Large hero image, badge, full-width CTA
- **Grid Cards:** Compact image + metadata, "Claim" affordance
- **Horizontal Card:** Side-by-side image and text layout
- **Search/Filter:** Ghost input with focus state, horizontal scroll buttons

### Bottom Navigation
- 5 items: Dashboard, ID, Certificates, News, **Perks (ACTIVE)**
- Active state: Primary red color + 110% scale
- Icon fill: 1 (Material Symbols FILL setting)

### Design Notes
- Consistent spacing: 24px between sections, 16px between grid items
- Border styling: Dashed border for empty state, rounded corners
- Shadows: Subtle elevation ("0px -4px 32px rgba(175,15,36,0.04)")
- Color usage: Primary red for active/CTAs, secondary for labels
- Image aspect ratios: Featured (16:10), Grid (1:1), Horizontal (variable with fixed height)
- Mobile-first: Single column with horizontal scroll for filters only
- Button states: Hover effects on all interactive elements

### Reference File
[STUDENT_PERKS_PAGE.html](STUDENT_PERKS_PAGE.html)

---

## 2. STAFF DASHBOARD

### Overview
The Staff Dashboard focuses on content management, user administration, and key performance metrics for institutional staff.

### Key Sections

#### Header & Identity
- **Top Bar:** Menu, "IT&B HUB" logo, profile avatar
- **Page Header:**
  - Sidebar motif + "STAFF PORTAL 2023/24"
  - Bold headline: "Dashboard"
  - Status badge (ACTIVE)
  - Role badge (e.g., "CONTENT MANAGER")

#### Primary Content

**1. Staff Information Card**
- Primary red background (similar to student card but adapted)
- Staff detail layout:
  - "STAFF ID CARD" label
  - Full name + title (e.g., "Content Manager")
  - Department
  - "EMPLOYEE ID" + ID number
  - Professional photo (monochrome)
  - "INSTITUTE OF TECH & BUSINESS" text

**2. Quick Stats (Bento Grid)**
- **Active Users Managed**
  - Large number
  - Arrow indicator (managed today)
- **Content Published**
  - Large number
  - Week-over-week change
- **Pending Reviews**
  - Large number with warning color if high
  - Link to review queue

**3. Recent Activity / To-Do List**
- Section header: "PENDING TASKS"
- Task cards showing:
  - Task type (e.g., "User Approval", "Content Review")
  - Task description
  - Due date
  - Priority indicator
  - Arrow to action

**4. System Health / Quick Links**
- Dark background section
- Key metrics:
  - Database status (green indicator)
  - API health
- Quick action buttons:
  - "View All Users"
  - "Create New Post"
  - "Manage Content"

#### Bottom Navigation
1. **Dashboard** (active - primary red)
2. **Users** (user management)
3. **Content** (posts, news, media)
4. **Reports** (analytics, logs)
5. **Settings** (admin settings)

---

## 3. LECTURER DASHBOARD

### Overview
The Lecturer Dashboard enables course management, student monitoring, and academic content delivery with focus on class performance and engagement.

### Key Sections

#### Header & Identity
- **Top Bar:** Menu, "IT&B HUB" logo, profile avatar
- **Page Header:**
  - Sidebar motif + "ACADEMIC YEAR 2023/24"
  - Bold headline: "My Classes"
  - Status badge + Department

#### Primary Content

**1. Instructor Information Card**
- Primary red background
- Lecturer detail layout:
  - "FACULTY ID CARD" label
  - Full name + academic title (e.g., "Dr.", "Prof.")
  - Department + Specialization
  - "FACULTY ID" + ID number
  - Professional photo
  - Office location/contact

**2. Class Overview (Bento Grid)**
- **Active Classes**
  - Large number (e.g., 4)
  - "View all classes" link
- **Total Students**
  - Large number
  - Class average (GPA, attendance, etc.)
- **Assignment Queue**
  - Large number of pending assignments
  - Urgent badge if any overdue

**3. This Semester's Classes**
- Section header: "MY CLASSES"
- Class cards for each course:
  - Course code + title (e.g., "CS402 - Advanced Algorithms")
  - Enrollment count (e.g., "24 Students")
  - Class time + room
  - Average performance
  - Action button (View Class Details)

**4. Recent Submissions / Class Activity**
- Section header: "RECENT ACTIVITY"
- Activity list showing:
  - Student name
  - Assignment title
  - Submission status (on-time, late, not submitted)
  - Grade (if graded)
  - Time indicator
  - Action button (Review)

**5. Grading Dashboard**
- Dark background section
- Quick stats:
  - Assignments to grade
  - Students at risk (low grades)
  - Average class performance
- Call-to-action: "Open Gradebook"

#### Bottom Navigation
1. **Dashboard** (active - primary red)
2. **Classes** (class management)
3. **Students** (view enrolled students)
4. **Grades** (gradebook)
5. **Resources** (course materials)

---

## 4. ALUMNI DASHBOARD

### Overview
The Alumni Dashboard nurtures post-graduate connections, professional opportunities, and community engagement.

### Key Sections

#### Header & Identity
- **Top Bar:** Menu, "IT&B HUB" logo, profile avatar
- **Page Header:**
  - Sidebar motif + "CLASS OF 2023"
  - Bold headline: "Alumni Hub"
  - Verified badge (Alumni Status)
  - Years since graduation

#### Primary Content

**1. Alumni Identity Card**
- Primary red background
- Alumni detail layout:
  - "ALUMNI CARD" label
  - Full name
  - Graduation year + Degree earned
  - "ALUMNI ID" + ID number (unique identifier)
  - Professional photo
  - Current role / company (if provided)
  - "INSTITUTE OF TECH & BUSINESS" text

**2. Career & Network Stats (Bento Grid)**
- **Your Network**
  - Large number (connected alumni)
  - "View connections" link
- **Profile Views**
  - Large number this month
  - Up/down trend
- **Job Opportunities**
  - Large number available
  - Matches in your field badge

**3. Alumni Events**
- Section header: "UPCOMING EVENTS"
- Event cards showing:
  - Event title (e.g., "Alumni Networking Mixer")
  - Date + time + location
  - Attendees count + profile pics
  - Event type badge (networking, webinar, reunion, etc.)
  - "Interested" / "Going" buttons

**4. Professional Opportunities / Job Board**
- Section header: "FEATURED OPPORTUNITIES"
- Opportunity cards showing:
  - Company name + logo
  - Job title (e.g., "Senior Software Engineer")
  - Location
  - Posted by (alumni/company)
  - "Apply" or "Learn More" button

**5. Alumni Community Updates**
- Dark background section
- Featured updates:
  - Success stories (alumni achievements)
  - New company partnerships
  - Upcoming class reunions
  - Featured alumni profile

#### Bottom Navigation
1. **Dashboard** (active - primary red)
2. **Profile** (view/edit alumni profile)
3. **Events** (alumni events + reunions)
4. **Jobs** (job board + opportunities)
5. **Network** (alumni network + connections)

---

## Design Component Specifications

### Consistent Elements Across All Roles

#### 1. Header Motif
```
[Red Bar] [YEAR/PERIOD] 
          [HEADLINE]
                          [STATUS]
```
- Red vertical bar: 2px width
- Label: `label-md` in primary red, tracking-widest
- Headline: `display-lg` bold
- Status: `label-xs` in secondary

#### 2. Info Cards (ID Cards)
- **Background:** Primary red (`#af0f24`)
- **Text:** White (`#ffffff`)
- **Pattern:** Subtle grid overlay (opacity 10%)
- **Layout:** Flex with photo on right, info on left
- **Shadow:** Primary-tinted ambient shadow
- **Corner Radius:** 2px (sharp)
- **Content:**
  - Card type label (STUDENT/STAFF/FACULTY/ALUMNI)
  - Primary name (bold, large)
  - Secondary info (subtitle)
  - ID number in monospace
  - Photo (monochrome, framed)
  - Institutional text (vertical)
  - Icon bottom-left (contactless/security/badge)
  - QR code or status indicator (bottom-right)

#### 3. Stat Cards (Bento Grid)
- **Background:** `surface-container-lowest` (`#ffffff`)
- **Text:** Headlines in `on-surface`, labels in primary red
- **Shadow:** Subtle primary-tinted shadow
- **Layout:** Vertical flex, space-between
- **Numbers:** `display-md` font weight 800
- **Labels:** `label-md` primary red, tracking-widest
- **Indicators:** Green for positive, orange/red for negative
- **Progress Bars:** Primary red, background `surface-container-high`

#### 4. Content Section Headers
```
[Red Bar] [UPPERCASE TITLE]       [ACTION LINK]
```
- Uses sidebar motif (2px red bar)
- Title in `headline` family, bold
- Action link in primary red, `label-xs`

#### 5. List / Activity Cards
- **Background:** `surface-container-low` (`#f3f3f3`)
- **Padding:** 4 (base unit = 4px, so 16px)
- **Border:** None, use tonal shift
- **Content:** Time/meta on left, details in flex-1
- **Divider:** Vertical line in `outline-variant` (opacity 30%)
- **Action:** Arrow icon (right side, opacity 40%)
- **Hover:** Slight background shift to `surface-container`

#### 6. Dark Action Sections
- **Background:** `on-background` (`#1a1c1c`)
- **Text:** White, secondary text in `secondary-fixed`
- **Icon Container:** Small square with primary red background
- **Layout:** Flex with icon + text, action indicator on right
- **Shadow:** None (sits on background)

#### 7. Bottom Navigation
- **Fixed:** Bottom, full width
- **Background:** 80% opacity white with 24px backdrop blur
- **Items:** 5 nav items
- **Active State:** Primary red, scaled 110%
- **Inactive State:** Gray, opacity 60%, hover to 100%
- **Height:** 80px (px-safe includes safe area)
- **Icon + Label:** Centered, flex-col
- **Icon:** Material Symbols (FILL 1 when active)
- **Label:** `label-xs`, font-bold, tracking-tight

---

## Responsive Behavior

### Mobile (Current - max-w-md)
- Single column layouts
- Bottom navigation for primary actions
- Horizontal scroll for class cards (if needed)
- Touch-friendly sizing (min 48px targets)

### Tablet (Future - max-w-2xl)
- Consider side navigation + main content
- Grid layouts expand (2-3 columns)
- Top navigation remains, keep bottom nav or switch to side

### Desktop (Future - max-w-full)
- Full sidebar navigation
- Multi-column layouts
- Larger typography
- Expanded bottom toolbar to side toolbar

---

## Color Application by Role

### Student
- Primary: Red (`#af0f24`)
- Secondary: Deep charcoal (`#1a1c1c`)
- Accent: Green for positive trends

### Staff
- Primary: Red (`#af0f24`)
- Secondary: Deep charcoal (`#1a1c1c`)
- Accent: Orange for pending/warning items

### Lecturer
- Primary: Red (`#af0f24`)
- Secondary: Deep charcoal (`#1a1c1c`)
- Accent: Blue for academic metrics

### Alumni
- Primary: Red (`#af0f24`)
- Secondary: Deep charcoal (`#1a1c1c`)
- Accent: Gold for achievements/premium opportunities

---

## Interaction Patterns

### Card Flips
- Student ID Card → Transcript view (rotate animation)
- Lecturer Class Card → Detailed view (slide up)
- Alumni Event Card → RSVP flow (expand + modal)

### Loading States
- Skeleton screens matching card layouts
- Pulse animation on primary red elements
- Progressive content loading

### Error States
- Error toast notifications (top or bottom)
- Red accent on problematic fields
- Retry buttons with try-again icon

### Success States
- Green indicator + checkmark
- Brief toast message
- Smooth transitions

---

## Typography Scale (All Roles)

Consistent across all dashboards:
- **Headlines:** Manrope, geometric precision
- **Body:** Inter, maximum readability
- **Labels:** Inter, bold weight, uppercase tracking
- **Display sizes:** Used sparingly for impact (magazine aesthetic)

---

## Spacing Standards

- **Grid Base:** 4px
- **Padding Small:** 4px (1 unit)
- **Padding Standard:** 16px (4 units)
- **Padding Large:** 24px (6 units)
- **Gap (horizontal):** 8px-16px
- **Gap (vertical):** 16px-24px
- **Section Margin:** 40px (10 units)

---

## Icon Usage (Material Symbols)

- **Top Bar:** menu, verified, profile avatar
- **ID Cards:** contactless, qr_code_2, security, badge
- **Navigation:** dashboard, badge, verified, newspaper, sell, people, school, work, groups
- **Actions:** arrow_forward_ios, trending_up, sync, sensors
- **Status:** check_circle, error, warning, info

All icons use FILL variation: 0 (outline), except when indicating active state (FILL: 1).

---

## Accessibility Considerations

1. **Color Contrast:** All text meets WCAG AA standards
2. **Touch Targets:** Minimum 48px for interactive elements
3. **Semantic HTML:** Proper heading hierarchy, ARIA labels
4. **Navigation:** Logical tab order, skip links
5. **Text:** Alternative text for all images
6. **Motion:** Reduced motion preferences respected

---

## Implementation Notes

- Use Tailwind CSS with custom color tokens
- Leverage `@apply` directives for consistent component styles
- Create reusable component library (card, button, header, nav)
- Use CSS Grid for bento layouts
- Implement responsive classes for future tablet/desktop views
- Use CSS custom properties for theme switching (if dark mode added)

---

## Next Steps for Development

1. Create base component library (Button, Card, Header, Nav)
2. Build Student Dashboard as primary reference
3. Adapt Staff, Lecturer, Alumni from student template
4. Test responsive behavior across devices
5. Implement navigation routing between dashboards
6. Add loading states and error handling
7. Integrate with backend API
8. Performance optimization (lazy loading, code splitting)

