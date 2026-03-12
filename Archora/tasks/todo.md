# ARCHORA — Active Tasks

## Rules
- One task per row. Owner = agent name.
- Status: [ ] todo | [x] done | [~] in-progress | [!] blocked

## Sprint: Foundation Complete → Feature Polish

### Auth Agent
- [x] Login, SignUp, Welcome, Onboarding screens
- [x] authStore + JWT refresh
- [x] useAuth hook
- [ ] Email verification flow
- [ ] Password reset screen

### Database Agent
- [x] Migrations 001–007
- [x] RLS policies on all tables
- [x] _shared/auth, _shared/quota, _shared/rateLimit, _shared/cors
- [x] _shared/errors, _shared/audit
- [ ] 008_create_notifications migration
- [ ] templates_feed view (denormalised)
- [ ] comments_with_author view

### 3D Blueprint Agent
- [x] blueprintStore (Zustand, MMKV auto-save)
- [x] Canvas2D (Skia, pan/zoom/tap)
- [x] ObjectInspector
- [x] ToolBar, PromptInput, TexturePicker
- [x] Viewer3D, InHouseView
- [x] ProceduralBuilding, ProceduralWall, ProceduralFloor
- [x] All 9 furniture components
- [x] geometry.ts, sceneHelpers.ts, use3DScene
- [ ] Undo/redo stack in blueprintStore
- [ ] Wall snap-to-grid in Canvas2D
- [ ] Opening (door/window) rendering in 3D

### AI Pipeline Agent
- [x] ai-generate Edge Function
- [x] transcribe Edge Function
- [x] ai-furniture Edge Function
- [ ] generate-texture Edge Function
- [ ] generate-furniture (Meshy) Edge Function

### AR Agent
- [x] ARScanScreen (stub)
- [x] arService
- [x] ar-reconstruct Edge Function
- [ ] Roboflow live detection integration
- [ ] Meshy polling for completed scans

### Payments Agent
- [x] SubscriptionScreen
- [x] useTierGate + TierGate component
- [x] TIER_LIMITS (single source of truth)
- [x] subscriptionService
- [x] stripe-webhook Edge Function
- [ ] stripe-checkout Edge Function
- [ ] stripe-portal Edge Function

### UI Social Agent
- [x] DashboardScreen, FeedScreen, AccountScreen
- [x] GenerationScreen, TemplateDetailScreen
- [x] ThemeCustomiserScreen
- [x] FeedCard, LikeButton, RatingStars, CommentThread
- [x] Input, Card, SkeletonLoader, ErrorBoundary, EmptyState
- [x] inspoService
- [ ] Notification centre screen
- [ ] Template publish flow
- [ ] Template purchase flow (Stripe)
