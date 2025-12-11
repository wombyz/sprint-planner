# Feature: Dashboard Layout & Navigation

## Feature Description
Create the main dashboard layout with navigation, dark mode styling, and foundational UI components for the Sprint Planner application. This feature establishes the application shell that all other pages will use, including a sidebar navigation, header with user info, main content area, glassmorphism styling utilities, and an empty state component for when no projects exist.

## User Story
As a Sprint Planner user
I want a modern, dark-themed dashboard with intuitive navigation
So that I can easily access my projects and settings while enjoying a visually appealing interface

## Problem Statement
The Sprint Planner application currently has only a minimal page with no layout, navigation, or styling. Users need a structured interface with:
- Clear navigation to access different sections (Projects, Settings)
- Visual feedback about their authenticated state (user info, logout)
- A responsive design that works on both mobile and desktop
- Modern dark-themed aesthetics with glassmorphism effects
- Proper font configuration for code blocks

## Solution Statement
Implement a comprehensive dashboard layout using Next.js App Router conventions with:
- A dedicated dashboard route group `app/(dashboard)` for authenticated pages
- Persistent sidebar navigation with icons and links to Projects and Settings
- Header component showing user information and logout functionality
- Tailwind CSS dark mode configured as default
- Custom glassmorphism utility class (`.glass`) for card styling
- JetBrains Mono font integration for code blocks
- Reusable EmptyState component for displaying when no data exists

## Pre-Implementation Analysis

### Environment Requirements
- API keys needed: None
- External services: Google Fonts (JetBrains Mono) - loaded via `next/font/google`
- New environment variables: None

### Blockers & Risks
- Known limitations: None identified
- Potential blockers: None identified
- Dependencies on other features/fixes: Depends on chunk-1 (foundation) - already complete. Uses auth patterns from @convex-dev/auth.

### Test Feasibility
- Unit testable: None - this feature is primarily UI/layout with no complex logic
- E2E testable: Navigation links work, dark mode visible, responsive layout, empty state displays
- Manual verification required: Visual appearance of glassmorphism effects, overall aesthetics
- Mock requirements: None - tests can use real Convex data (project list query returns empty for new users)

## Relevant Files
Use these files to implement the feature:

- `app/app/layout.tsx` - Root layout (needs Convex provider, font configuration)
- `app/app/page.tsx` - Current home page (will redirect to dashboard or be replaced)
- `app/convex/projects.ts` - Projects list query (for checking if projects exist in dashboard)
- `app/convex/schema.ts` - Schema reference for user data
- `app/package.json` - Dependencies (may need Lucide React icons, shadcn/ui components)
- `README.md` - Project documentation for architecture reference
- `.claude/commands/test_e2e.md` - E2E test runner documentation
- `.claude/commands/e2e/TEST_TEMPLATE.md` - E2E test template
- `.claude/commands/e2e/TEST_DATA_GUIDELINES.md` - Test data patterns

### New Files
- `app/app/(dashboard)/layout.tsx` - Dashboard layout with sidebar and header
- `app/app/(dashboard)/page.tsx` - Dashboard home page
- `app/app/globals.css` - Global styles with Tailwind and custom utilities
- `app/components/shared/EmptyState.tsx` - Reusable empty state component
- `app/tailwind.config.ts` - Tailwind configuration with dark mode and fonts
- `app/postcss.config.mjs` - PostCSS configuration for Tailwind
- `app/components/layout/Sidebar.tsx` - Sidebar navigation component
- `app/components/layout/Header.tsx` - Header component with user info
- `.claude/commands/e2e/test_dashboard_layout.md` - E2E test specification for dashboard layout

## Implementation Plan

### Phase 1: Foundation
Set up Tailwind CSS, PostCSS, global styles, and font configuration. This provides the styling foundation for all subsequent components.

### Phase 2: Core Implementation
Build the layout components: Sidebar navigation, Header with user info, and the dashboard layout that combines them. Implement the (dashboard) route group structure.

### Phase 3: Integration
Create the dashboard home page with project list integration and empty state handling. Wire up navigation, implement Convex provider in root layout, and ensure auth state is properly displayed.

## Step by Step Tasks

### Step 1: Install dependencies
- Install Tailwind CSS and related packages: `cd app && pnpm add tailwindcss postcss autoprefixer`
- Initialize Tailwind config: `cd app && npx tailwindcss init -p --ts`
- Install Lucide React for icons: `cd app && pnpm add lucide-react`
- Install clsx and tailwind-merge for className utilities: `cd app && pnpm add clsx tailwind-merge`

### Step 2: Configure Tailwind CSS with dark mode
- Update `app/tailwind.config.ts`:
  - Set `darkMode: 'class'`
  - Configure content paths for app, components
  - Add JetBrains Mono to font family configuration
  - Extend theme colors for dark mode palette

### Step 3: Create globals.css with glassmorphism utilities
- Create `app/app/globals.css`:
  - Import Tailwind base, components, utilities
  - Add `.glass` utility class for glassmorphism effect (backdrop-blur, semi-transparent background, subtle border)
  - Add `.font-mono` override to use JetBrains Mono
  - Set dark mode as default on html/body

### Step 4: Configure fonts in root layout
- Update `app/app/layout.tsx`:
  - Import JetBrains Mono and Inter from `next/font/google`
  - Configure font variables
  - Add `dark` class to html element for default dark mode
  - Set up proper metadata (title, description)
  - Wrap children with ConvexAuthProvider (from @convex-dev/auth)

### Step 5: Create cn utility function
- Create `app/lib/utils.ts`:
  - Export `cn` function combining clsx and tailwind-merge
  - This is the standard pattern for conditional className joining

### Step 6: Create Sidebar component
- Create `app/components/layout/Sidebar.tsx`:
  - Client component with `'use client'` directive
  - Navigation links: Projects (FolderKanban icon), Settings (Settings icon)
  - Use Next.js `Link` component and `usePathname` for active state
  - Apply `.glass` class for styling
  - Make collapsible on mobile (hamburger menu)
  - Show app logo/name at top

### Step 7: Create Header component
- Create `app/components/layout/Header.tsx`:
  - Client component with `'use client'` directive
  - Display current user info (name/email) from Convex auth
  - Logout button using `useAuthActions` from @convex-dev/auth
  - Apply `.glass` class for styling
  - Mobile menu toggle button

### Step 8: Create EmptyState component
- Create `app/components/shared/EmptyState.tsx`:
  - Props: `icon`, `title`, `description`, `action` (optional button)
  - Centered layout with large icon, heading, description text
  - Optional CTA button for primary action
  - Use glassmorphism styling

### Step 9: Create dashboard layout
- Create `app/app/(dashboard)/layout.tsx`:
  - Import Sidebar and Header components
  - Implement responsive layout: sidebar fixed on desktop, drawer on mobile
  - Main content area with proper padding and overflow handling
  - Require authentication (redirect to login if not authenticated)

### Step 10: Create dashboard home page
- Create `app/app/(dashboard)/page.tsx`:
  - Client component using `useQuery` for project list
  - Display loading state while fetching
  - Show EmptyState if no projects exist with CTA to create first project
  - Show project list section (placeholder for now - actual ProjectCard comes later)
  - Page title "Dashboard" or "Projects"

### Step 11: Set up Convex provider in root layout
- Update `app/app/layout.tsx`:
  - Add ConvexAuthProvider from @convex-dev/auth/react
  - Wrap children with provider
  - Import globals.css

### Step 12: Create E2E test specification
- Create `.claude/commands/e2e/test_dashboard_layout.md`:
  - Test navigation links work (click Projects, click Settings)
  - Test dark mode is active by default
  - Test responsive layout (desktop sidebar, mobile hamburger)
  - Test user info displays in header
  - Test empty state shows when no projects

### Step 13: Run validation commands
- Run `cd app && npx tsc --noEmit` to verify TypeScript compilation
- Run `cd app && pnpm build` to verify build succeeds
- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_dashboard_layout.md` to validate E2E functionality

## Testing Strategy

### Unit Tests
N/A - This feature is primarily UI/layout components with no complex business logic that warrants unit testing. The functionality is better validated through E2E tests.

### Edge Cases
- User not authenticated (should redirect to login)
- User with very long email/name (should truncate gracefully)
- Very narrow viewport (mobile layout should activate)
- JavaScript disabled (should show basic content)

### E2E Tests Required
IMPORTANT: List all E2E test files that must pass for this feature to be complete.

- `test_dashboard_layout.md` - Validates dashboard layout, navigation, and empty state

If creating a new E2E test, specify:
- New E2E test file: `.claude/commands/e2e/test_dashboard_layout.md`
- What it validates: Dashboard layout renders, navigation links work, dark mode is active, responsive behavior, user info displays, empty state shows for new users

## Test Data Strategy

### Data Dependencies
- Test user account (test@mail.com / password123) - pre-existing
- Empty project state for testing EmptyState component

### Mock Data Approach
N/A - tests can use real data created during test flow. For empty state testing, we rely on a fresh user or one with no projects.

### Cost Implications
None - no external API calls involved. All operations use Convex queries which are free in development.

See `.claude/commands/e2e/TEST_DATA_GUIDELINES.md` for available test helpers and patterns.

## Acceptance Criteria
- [ ] Layout renders without errors
- [ ] Dark mode is active by default (dark background, light text)
- [ ] Navigation links work (Projects, Settings paths route correctly)
- [ ] Responsive on mobile/desktop (sidebar collapses to hamburger on mobile)
- [ ] User info displays in header (email/name from authenticated user)
- [ ] Logout button works
- [ ] Empty state component displays when no projects exist
- [ ] Glassmorphism `.glass` class creates proper visual effect
- [ ] JetBrains Mono font loads for code blocks
- [ ] TypeScript compilation passes with no errors
- [ ] Production build succeeds

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# Verify TypeScript compilation
cd app && npx tsc --noEmit

# Run production build to verify no build errors
cd app && pnpm build

# Run E2E tests to validate functionality
# Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_dashboard_layout.md
```

## Notes
- The dashboard uses a route group `(dashboard)` which doesn't affect URL structure but allows shared layout
- Dark mode is set as default by adding `dark` class to the `<html>` element - no toggle is needed for MVP
- The glassmorphism effect uses `backdrop-blur` and semi-transparent backgrounds - this may have performance implications on older devices
- JetBrains Mono is specifically for code blocks (manifest display, etc.) - Inter remains the primary UI font
- The sidebar navigation is minimal for MVP (Projects, Settings) - additional items can be added later
- Authentication check in dashboard layout will redirect unauthenticated users to `/login` (login page implementation is separate chunk)
- EmptyState component is generic and reusable across the application
- Consider adding loading skeleton states in future iterations
