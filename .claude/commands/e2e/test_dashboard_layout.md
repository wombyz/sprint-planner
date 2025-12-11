# E2E Test: Dashboard Layout & Navigation

## Test: Dashboard Layout & Navigation

### Overview
Validates that the main dashboard layout renders correctly with sidebar navigation, header with user info, dark mode styling, responsive behavior, and empty state display.

### Prerequisites
- Server must be running (Convex + Next.js)
- Test user must exist (credentials: test@mail.com / password123)
- No specific seed data required (tests empty state naturally)

### Test File
`app/tests/e2e/dashboard_layout.test.js`

### User Story
As a Sprint Planner user, I want a modern dashboard with clear navigation so I can easily access my projects and settings while enjoying a dark-themed interface.

### Test Steps

#### Step 1: Setup - Navigate and Login
1. Navigate to `http://localhost:3000/login`
2. Wait for page to load (login form visible)
3. Fill email input with `test@mail.com`
4. Fill password input with `password123`
5. Click the submit/login button
6. Wait for redirect to dashboard (`/` or `/dashboard`)
7. **Verify**: Dashboard page loads successfully

#### Step 2: Verify Dark Mode is Active
1. Check the `<html>` element has class `dark`
2. **Verify**: Background color is dark (not white/light)
3. **Verify**: Text color is light (white/gray)
4. Take screenshot: `01_dark_mode_active.png`

#### Step 3: Verify Sidebar Navigation
1. **Verify**: Sidebar is visible on desktop viewport
2. **Verify**: "Projects" link is visible in sidebar
3. **Verify**: "Settings" link is visible in sidebar
4. **Verify**: App logo or name is displayed at top of sidebar
5. Take screenshot: `02_sidebar_navigation.png`

#### Step 4: Verify Header Component
1. **Verify**: Header is visible at top of main content area
2. **Verify**: User info (email or name) is displayed in header
3. **Verify**: Logout button is visible
4. Take screenshot: `03_header_with_user_info.png`

#### Step 5: Verify Navigation Links Work
1. Click on "Settings" link in sidebar
2. Wait for navigation
3. **Verify**: URL contains `/settings` OR settings content is visible
4. Click on "Projects" link in sidebar
5. Wait for navigation
6. **Verify**: URL is `/` or `/projects` OR projects content is visible
7. Take screenshot: `04_navigation_working.png`

#### Step 6: Verify Empty State (if no projects)
1. Navigate to main dashboard/projects page
2. If no projects exist for user:
   - **Verify**: EmptyState component is visible
   - **Verify**: Empty state has descriptive text (e.g., "No projects yet")
   - **Verify**: Empty state has a call-to-action button (e.g., "Create Project")
3. Take screenshot: `05_empty_state.png`

#### Step 7: Verify Responsive Layout (Mobile)
1. Resize viewport to mobile width (375px)
2. **Verify**: Sidebar is hidden or collapsed
3. **Verify**: Hamburger menu icon is visible
4. Click hamburger menu icon
5. **Verify**: Sidebar/navigation drawer opens
6. Take screenshot: `06_mobile_responsive.png`
7. Resize viewport back to desktop (1280px)

#### Step 8: Verify Logout Functionality
1. Click the logout button in header
2. Wait for redirect
3. **Verify**: User is redirected to login page OR logged out state is shown
4. Take screenshot: `07_logout_complete.png`

### Success Criteria
- [ ] Dashboard loads without errors after login
- [ ] Dark mode is visually active (dark background, light text)
- [ ] Sidebar navigation is visible with Projects and Settings links
- [ ] Header displays user info and logout button
- [ ] Navigation links route to correct pages
- [ ] Empty state displays when no projects exist
- [ ] Mobile responsive layout works (hamburger menu)
- [ ] Logout functionality works

### Test Data
- Test user: test@mail.com / password123
- No mock data needed - tests verify layout and navigation, not data-dependent features

### Cleanup
No cleanup required - test only reads data and navigates, does not create or modify data.

### Notes
- If user has existing projects, Step 6 may not show EmptyState - this is acceptable
- Glassmorphism effect is visual and not automatically testable - verify via screenshots
- Dark mode should be default without needing a toggle
- Mobile breakpoint is typically 768px, but test at 375px for true mobile experience

---

## Output Format

Return results as JSON:

```json
{
  "test_name": "Dashboard Layout & Navigation",
  "status": "passed|failed",
  "screenshots": [
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/01_dark_mode_active.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/02_sidebar_navigation.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/03_header_with_user_info.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/04_navigation_working.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/05_empty_state.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/06_mobile_responsive.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/dashboard_layout/07_logout_complete.png"
  ],
  "error": null
}
```
