# src/screens/ — Screen Context

Owner: Auth Agent (auth/) · AR Agent (ar/) · 3D Blueprint Agent (workspace/)
       Payments Agent (subscription/) · UI Social Agent (everything else)

## Screen Patterns
- Screens are thin orchestrators — fetch data via hooks, render components
- No business logic in screens — move to hooks or services
- Each screen folder can have a local `index.ts` barrel if it grows
- Screen names always end in `Screen` (PascalCase)

## Navigation
- React Navigation v6
- Auth flow: RootNavigator → AuthNavigator (Login, SignUp, Welcome, Onboarding)
- Main flow: RootNavigator → MainNavigator (tabs: Dashboard, Feed, Generate, AR, Account)
- Workspace: modal stack on top of MainNavigator

## Screen → Hook → Service → Edge Function chain
```
Screen
  └─ useBlueprint / useProjects / useSubscription
       └─ aiService / projectService / subscriptionService
            └─ Supabase Edge Function
                 └─ _shared/auth · _shared/quota · _shared/audit
```

## Do not
- Call Supabase directly from a screen
- Use StyleSheet.create
- Use ActivityIndicator (use CompassRoseLoader)
- Access blueprintStore directly — use useBlueprint hook
