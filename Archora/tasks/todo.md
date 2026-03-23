# ASORIA — Active Tasks

## Rules
- One task per row. Owner = agent name.
- Status: [ ] todo | [x] done | [~] in-progress | [!] blocked

## Sprint: Foundation Complete → Feature Polish

### Auth Agent
- [x] Login, SignUp, Welcome, Onboarding screens
- [x] authStore + JWT refresh
- [x] useAuth hook
- [x] Email verification flow (EmailVerificationScreen)
- [x] Password reset screen (ForgotPasswordScreen + ResetPasswordScreen)

### Database Agent
- [x] Migrations 001–012
- [x] RLS policies on all tables
- [x] _shared/auth, _shared/quota, _shared/rateLimit, _shared/cors
- [x] _shared/errors, _shared/audit
- [x] 011_notifications migration (payload JSONB schema)
- [x] 013_notifications_patch (Realtime pub + system type)
- [x] templates_feed view (denormalised)
- [x] comments_with_author view

### 3D Blueprint Agent
- [x] blueprintStore (Zustand, MMKV auto-save)
- [x] Canvas2D (Skia, pan/zoom/tap)
- [x] ObjectInspector
- [x] ToolBar, PromptInput, TexturePicker
- [x] Viewer3D, InHouseView
- [x] ProceduralBuilding, ProceduralWall, ProceduralFloor
- [x] All 9 furniture components
- [x] geometry.ts, sceneHelpers.ts, use3DScene
- [x] Undo/redo stack in blueprintStore (history, undo, redo, useShakeDetector)
- [x] Wall snap-to-grid in Canvas2D
- [x] Opening (door/window) rendering in 3D

### AI Pipeline Agent
- [x] ai-generate Edge Function
- [x] transcribe Edge Function
- [x] ai-furniture Edge Function
- [x] generate-texture Edge Function
- [x] generate-furniture (Meshy) Edge Function
- [!] FUTURE: generate-texture uses a blocking 60-second polling loop waiting for
      Replicate to complete. Should be refactored to an async job queue pattern
      (e.g., Supabase pg_cron + status polling endpoint) to prevent timeout failures
      under load. Deferred — not a blocking security concern.

### AR Agent
- [x] ARScanScreen (stub)
- [x] arService
- [x] ar-reconstruct Edge Function
- [ ] Roboflow live detection integration
- [ ] Meshy polling for completed scans

### Payments Agent
- [x] SubscriptionScreen (real Stripe checkout integration)
- [x] useTierGate + TierGate component
- [x] TIER_LIMITS (single source of truth)
- [x] subscriptionService
- [x] stripe-webhook Edge Function (checkout.session.completed + notifications)
- [x] stripe-checkout Edge Function
- [x] stripe-portal Edge Function
- [x] Deep links: asoria:// scheme, subscription-success handler, reset-password routing

### UI Social Agent
- [x] DashboardScreen, FeedScreen, AccountScreen
- [x] GenerationScreen, TemplateDetailScreen
- [x] ThemeCustomiserScreen
- [x] FeedCard, LikeButton, RatingStars, CommentThread
- [x] Input, Card, SkeletonLoader, ErrorBoundary, EmptyState
- [x] inspoService
- [x] NotificationPanel with Realtime subscription (system notification type added)
- [x] Template publish flow
- [x] Template purchase flow (Stripe)
