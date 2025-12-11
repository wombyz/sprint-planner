# E2E Test: Project Cards & List UI

## Test: Project Cards & List UI

### Overview
Validates that project cards display correctly in a responsive grid with all required fields (name, GitHub repo, commit hash, review count, last updated), loading skeleton states appear during data fetch, and card click navigation works.

### Prerequisites
- Server must be running (Convex + Next.js)
- Test user must exist (credentials: test@mail.com / password123)
- Test will create its own project data and clean up after

### Test File
`app/tests/e2e/project_cards.test.js`

### User Story
As a Sprint Planner user, I want to see my projects displayed as cards in a responsive grid so that I can quickly view project status and navigate to project details.

### Test Steps

#### Step 1: Setup - Navigate and Login
1. Navigate to `http://localhost:3000/login`
2. Wait for page to load (login form visible)
3. Fill email input with `test@mail.com`
4. Fill password input with `password123`
5. Click the submit/login button
6. Wait for redirect to dashboard (`/`)
7. **Verify**: Dashboard page loads successfully

#### Step 2: Verify Loading State (if observable)
1. On page load, before data arrives, skeleton loading cards should appear
2. **Verify**: Loading skeleton cards have `animate-pulse` class
3. **Verify**: 3 skeleton cards are displayed during loading
4. Take screenshot: `01_loading_skeleton.png` (may need to capture quickly or use network throttling)

#### Step 3: Create Test Project Data
1. Use browser console or API to create a test project:
   - Name: "E2E Test Project"
   - GitHub Owner: "test-owner"
   - GitHub Repo: "test-repo"
   - lastSyncedCommit: "abc1234567890" (to verify truncation)
2. Create 2 test reviews for the project to verify review count
3. Wait for UI to update (Convex subscription should auto-update)
4. **Verify**: Project card appears in the grid

#### Step 4: Verify Project Card Content
1. Locate the test project card
2. **Verify**: Project name "E2E Test Project" is displayed
3. **Verify**: GitHub repo shows "test-owner/test-repo"
4. **Verify**: Commit hash is truncated to 7 characters ("abc1234")
5. **Verify**: Review count shows "2 reviews"
6. **Verify**: Last updated timestamp is displayed (e.g., "just now" or "X minutes ago")
7. Take screenshot: `02_project_card_content.png`

#### Step 5: Verify Card Styling
1. **Verify**: Card has glass/glassmorphism styling
2. **Verify**: Card has FolderKanban icon with blue styling
3. **Verify**: Card has hover effect (glass-hover class)
4. **Verify**: Card displays GitBranch icon next to commit hash
5. **Verify**: Card displays MessageSquare icon next to review count
6. **Verify**: Card displays Clock icon next to timestamp
7. Take screenshot: `03_card_styling.png`

#### Step 6: Verify Responsive Grid (Desktop)
1. Set viewport to desktop width (1280px)
2. **Verify**: Grid displays up to 3 columns (lg:grid-cols-3)
3. Take screenshot: `04_grid_desktop.png`

#### Step 7: Verify Responsive Grid (Tablet)
1. Resize viewport to tablet width (768px)
2. **Verify**: Grid displays 2 columns (sm:grid-cols-2)
3. Take screenshot: `05_grid_tablet.png`

#### Step 8: Verify Responsive Grid (Mobile)
1. Resize viewport to mobile width (375px)
2. **Verify**: Grid displays 1 column (grid-cols-1)
3. Take screenshot: `06_grid_mobile.png`
4. Resize viewport back to desktop (1280px)

#### Step 9: Verify Card Click Navigation
1. Click on the test project card
2. Wait for navigation
3. **Verify**: URL contains `/projects/` followed by the project ID
4. Take screenshot: `07_project_detail_navigation.png`
5. Navigate back to dashboard

#### Step 10: Test Project Without Synced Commit
1. Create another test project without lastSyncedCommit
2. Wait for UI to update
3. **Verify**: Card shows "Not synced" instead of commit hash
4. Take screenshot: `08_not_synced_state.png`

#### Step 11: Test Project With Zero Reviews
1. Locate the project without reviews (or create one)
2. **Verify**: Card shows "0 reviews"
3. Take screenshot: `09_zero_reviews.png`

### Cleanup
1. Delete test projects created during the test
2. Delete test reviews created during the test

### Success Criteria
- [ ] Loading skeleton displays 3 cards with animate-pulse
- [ ] Project cards display project name
- [ ] Project cards display GitHub repo in owner/repo format
- [ ] Project cards display last synced commit truncated to 7 chars
- [ ] Project cards display "Not synced" when no commit
- [ ] Project cards display review count
- [ ] Project cards display last updated in relative format
- [ ] Grid is responsive (1 col mobile, 2 cols tablet, 3 cols desktop)
- [ ] Card click navigates to project detail page
- [ ] Real-time updates work via Convex subscription

### Test Data
- Test user: test@mail.com / password123
- Test project: Created during test with known values
- Test reviews: Created during test to verify count

### Notes
- The project detail page (`/projects/[id]`) may 404 if not implemented yet - this is acceptable for this test
- Loading skeleton may be difficult to capture as data loads quickly - consider network throttling
- Real-time updates are automatic with Convex useQuery, verified by creating data and seeing UI update

---

## Output Format

Return results as JSON:

```json
{
  "test_name": "Project Cards & List UI",
  "status": "passed|failed",
  "screenshots": [
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/01_loading_skeleton.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/02_project_card_content.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/03_card_styling.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/04_grid_desktop.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/05_grid_tablet.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/06_grid_mobile.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/07_project_detail_navigation.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/08_not_synced_state.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/project_cards/09_zero_reviews.png"
  ],
  "error": null
}
```
