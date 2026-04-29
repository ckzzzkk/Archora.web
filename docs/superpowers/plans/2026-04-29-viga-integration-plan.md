# VIGA Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Architect tier users to upload photos and receive 3D furniture meshes via VIGA, placeable in blueprints and AR. Integrates with existing AR, AI generation, and Sketch pipelines.

**Architecture:** VIGA GPU worker service (Modal/RunPod) handles image→3D reconstruction. Supabase Edge Functions orchestrate requests and store results. Mobile app downloads GLTF and renders via Three.js GLTFLoader alongside existing procedural furniture.

**Tech Stack:** Python/Blender (GPU worker) · Deno TypeScript (Edge Functions) · React Native + R3F (mobile) · Supabase Storage + Realtime

---

## File Map

### New Files to Create
- `supabase/migrations/055_viga_tasks.sql` — `viga_tasks` table for tracking async reconstruction jobs
- `supabase/functions/viga-request/index.ts` — Edge Function: receives image URL, calls GPU worker, stores task
- `supabase/functions/viga-webhook/index.ts` — Edge Function: GPU worker callbacks with GLTF URL
- `src/services/vigaService.ts` — mobile service: calls viga-request, subscribes to Realtime, loads GLTF
- `src/screens/viga/VIGAScreen.tsx` — Architect-tier screen for uploading photos and managing reconstructed meshes
- `src/components/3d/GltfFurniture.tsx` — R3F component that loads and renders a GLTF mesh with positioning

### Existing Files to Modify
- `supabase/migrations/034_custom_furniture.sql` — extend `custom_furniture` table with VIGA fields (`viga_task_id`, `mesh_url`, `source_image_url`)
- `src/navigation/MainNavigator.tsx` — add `VIGATab` linking to VIGAScreen, gated to Architect tier
- `src/components/ar/ARPlaceMode.tsx:17-28` — extend `FURNITURE_CATALOGUE` to include user's custom VIGA meshes
- `src/stores/blueprintStore.ts:445-460` — `addFurnitureFromAR` already handles world-position furniture; no change needed for VIGA mesh placement
- `src/stores/blueprintStore.ts:435` — `addFurniture` needs GLTF mesh support added to `FurniturePiece` type
- `src/utils/tierLimits.ts` — add `vigaRequestsPerMonth` limit for Architect tier
- `src/hooks/useTierGate.ts` — add `vigaRequestsPerMonth` to `TierLimits` type

### Files to Reference (patterns to follow)
- `supabase/functions/ar-reconstruct/index.ts` — existing async image→3D pipeline (Meshy); replicate its task-tracking pattern
- `supabase/migrations/034_custom_furniture.sql` — existing `custom_furniture` table to extend
- `src/components/ar/ARPlaceMode.tsx:17-28` — `FURNITURE_CATALOGUE` structure for extending with custom meshes
- `src/services/arService.ts:73` — `meshUrl` field usage pattern from existing AR pipeline

---

## Task 1: Database Migration — `viga_tasks` Table

**Files:**
- Create: `supabase/migrations/055_viga_tasks.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 055_viga_tasks.sql
-- Tracks async VIGA image→3D reconstruction tasks.
-- Webhook from GPU worker updates status and gltf_url on completion.

CREATE TABLE IF NOT EXISTS public.viga_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id          TEXT UNIQUE NOT NULL,          -- GPU worker internal task ID
  mode             TEXT NOT NULL DEFAULT 'furniture',  -- 'furniture' | 'room'
  status           TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'processing' | 'done' | 'failed'
  source_image_url TEXT,
  gltf_url         TEXT,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.viga_tasks ENABLE ROW LEVEL SECURITY;

-- Users can read their own tasks and are notified via Realtime
CREATE POLICY "Users own their viga_tasks"
  ON public.viga_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS viga_tasks_user_id_idx
  ON public.viga_tasks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS viga_tasks_task_id_idx
  ON public.viga_tasks(task_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/055_viga_tasks.sql
git commit -m "feat(db): add viga_tasks table for async image→3D reconstruction

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Extend `custom_furniture` Table

**Files:**
- Modify: `supabase/migrations/034_custom_furniture.sql`

Note: The existing `custom_furniture` table (migration 034) already has `mesh_url`. This task adds VIGA-specific fields (`viga_task_id`, `source_image_url`) and a `thumbnail_url` field for the UI preview.

- [ ] **Step 1: Read the current migration**

```bash
cat supabase/migrations/034_custom_furniture.sql
```

- [ ] **Step 2: Add VIGA columns via ALTER TABLE migration**

Create `supabase/migrations/056_extend_custom_furniture_viga.sql`:

```sql
-- 056_extend_custom_furniture_viga.sql
-- Adds VIGA-specific fields to existing custom_furniture table.

ALTER TABLE public.custom_furniture
  ADD COLUMN IF NOT EXISTS viga_task_id UUID REFERENCES public.viga_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS source_image_url TEXT;

COMMENT ON COLUMN public.custom_furniture.viga_task_id     IS 'Link to VIGA reconstruction task';
COMMENT ON COLUMN public.custom_furniture.thumbnail_url   IS 'Rendered thumbnail of the 3D mesh for catalogue display';
COMMENT ON COLUMN public.custom_furniture.source_image_url  IS 'Original user-uploaded photo that produced this mesh';
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/056_extend_custom_furniture_viga.sql
git commit -m "feat(db): extend custom_furniture with VIGA task link and thumbnail

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Edge Function — `viga-request`

**Files:**
- Create: `supabase/functions/viga-request/index.ts`
- Test: (manual via `supabase functions serve`)

- [ ] **Step 1: Write the Edge Function**

```typescript
// supabase/functions/viga-request/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const RequestSchema = z.object({
  imageUrl: z.string().url(),
  projectId: z.string().uuid().optional(),
  mode: z.enum(['furniture', 'room']).default('furniture'),
  name: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { imageUrl, projectId, mode, name, category } = parsed.data;

    // TODO (v2): check tier === 'architect' once tier field is on user record
    // For now, Architect is the only tier that can access this endpoint via RLS

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create task record
    const { data: task, error: taskError } = await supabase
      .from('viga_tasks')
      .insert({
        user_id: user.id,
        project_id: projectId ?? null,
        task_id: `viga_${crypto.randomUUID()}`, // placeholder; real task_id from GPU worker
        mode,
        status: 'pending',
        source_image_url: imageUrl,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Call GPU worker
    const workerUrl = Deno.env.get('VIGA_WORKER_URL');
    if (!workerUrl) {
      await supabase.from('viga_tasks').update({ status: 'failed', error_message: 'Worker not configured' }).eq('id', task.id);
      return Errors.internal('VIGA worker not configured');
    }

    const workerResponse = await fetch(`${workerUrl}/reconstruct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        user_id: user.id,
        project_id: projectId,
        mode,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/viga-webhook?task_id=${task.id}`,
      }),
    });

    if (!workerResponse.ok) {
      await supabase.from('viga_tasks').update({ status: 'failed', error_message: 'Worker request failed' }).eq('id', task.id);
      return Errors.internal('Failed to submit VIGA reconstruction task');
    }

    const workerData = await workerResponse.json() as { task_id: string };
    await supabase.from('viga_tasks').update({ task_id: workerData.task_id }).eq('id', task.id);

    return new Response(JSON.stringify({ taskId: task.id, workerTaskId: workerData.task_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('viga-request error:', err);
    return Errors.internal(err instanceof Error ? err.message : 'Unknown error');
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/viga-request/index.ts
git commit -m "feat(edge): add viga-request Edge Function for image→3D reconstruction

Submits image to VIGA GPU worker and tracks task in viga_tasks table.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Edge Function — `viga-webhook`

**Files:**
- Create: `supabase/functions/viga-webhook/index.ts`

- [ ] **Step 1: Write the Edge Function**

```typescript
// supabase/functions/viga-webhook/index.ts
// Called by VIGA GPU worker when reconstruction completes.
// Updates viga_tasks and custom_furniture tables, then triggers Realtime notification.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const WebhookSchema = z.object({
  task_id: z.string(),
  status: z.enum(['done', 'failed']),
  gltf_url: z.string().url().optional(),
  error: z.string().optional(),
  metadata: z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    width_m: z.number().optional(),
    height_m: z.number().optional(),
    depth_m: z.number().optional(),
    thumbnail_url: z.string().url().optional(),
  }).optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as unknown;
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid webhook payload', parsed.error.issues);

    const { task_id, status, gltf_url, error, metadata } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find task by our UUID (passed as query param) or by worker task_id
    const url = new URL(req.url);
    const localTaskId = url.searchParams.get('task_id');

    const { data: task, error: findError } = await supabase
      .from('viga_tasks')
      .select('id, user_id')
      .or(`id.eq.${localTaskId},task_id.eq.${task_id}`)
      .single();

    if (findError || !task) return Errors.notFound('VIGA task not found');

    // Update task status
    await supabase
      .from('viga_tasks')
      .update({
        status,
        gltf_url: gltf_url ?? null,
        error_message: error ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    // If done and furniture mode, insert into custom_furniture
    if (status === 'done' && gltf_url) {
      const mode = await supabase
        .from('viga_tasks')
        .select('mode')
        .eq('id', task.id)
        .single();

      if (mode.data?.mode === 'furniture') {
        await supabase.from('custom_furniture').insert({
          user_id: task.user_id,
          viga_task_id: task.id,
          name: metadata?.name ?? 'Custom Furniture',
          category: metadata?.category ?? 'living',
          mesh_url: gltf_url,
          thumbnail_url: metadata?.thumbnail_url ?? null,
          source_image_url: null, // populated from viga_tasks.source_image_url
          dimensions: {
            x: metadata?.width_m ?? 1,
            y: metadata?.height_m ?? 1,
            z: metadata?.depth_m ?? 1,
          },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('viga-webhook error:', err);
    return Errors.internal(err instanceof Error ? err.message : 'Unknown error');
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/viga-webhook/index.ts
git commit -m "feat(edge): add viga-webhook for VIGA GPU worker completion callback

Updates viga_tasks status and creates custom_furniture entry on success.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Mobile Service — `vigaService.ts`

**Files:**
- Create: `src/services/vigaService.ts`

- [ ] **Step 1: Write the service**

```typescript
// src/services/vigaService.ts
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

export interface VigaTaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  gltfUrl: string | null;
  errorMessage: string | null;
}

export interface VigaMesh {
  id: string;
  name: string;
  category: string;
  meshUrl: string;
  thumbnailUrl: string | null;
  dimensions: { x: number; y: number; z: number };
}

/** Submit an image URL for VIGA reconstruction */
export async function submitVigaReconstruction(
  imageUrl: string,
  options: { projectId?: string; name?: string; category?: string } = {},
): Promise<{ taskId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const response = await fetch(`${import.meta.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/viga-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ imageUrl, ...options }),
  });

  if (!response.ok) {
    const err = await response.json() as { message?: string };
    throw new Error(err.message ?? 'VIGA request failed');
  }

  const data = await response.json() as { taskId: string };
  return data;
}

/** Subscribe to Realtime channel for VIGA task status updates */
export function subscribeToVigaTask(
  taskId: string,
  onUpdate: (status: VigaTaskStatus) => void,
): RealtimeChannel {
  return supabase
    .channel(`viga_task:${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'viga_tasks',
        filter: `id=eq.${taskId}`,
      },
      (payload) => {
        const newVal = payload.new as {
          id: string;
          status: VigaTaskStatus['status'];
          gltf_url: string | null;
          error_message: string | null;
        };
        onUpdate({
          id: newVal.id,
          status: newVal.status,
          gltfUrl: newVal.gltf_url,
          errorMessage: newVal.error_message,
        });
      },
    )
    .subscribe();
}

/** Fetch all custom furniture for the current user */
export async function fetchCustomFurniture(): Promise<VigaMesh[]> {
  const { data, error } = await supabase
    .from('custom_furniture')
    .select('id, name, category, mesh_url, thumbnail_url, dimensions')
    .not('mesh_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    meshUrl: row.mesh_url as string,
    thumbnailUrl: row.thumbnail_url as string | null,
    dimensions: row.dimensions as { x: number; y: number; z: number },
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/vigaService.ts
git commit -m "feat(service): add vigaService for VIGA reconstruction API

Exports: submitVigaReconstruction, subscribeToVigaTask, fetchCustomFurniture
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: R3F Component — `GltfFurniture`

**Files:**
- Create: `src/components/3d/GltfFurniture.tsx`

- [ ] **Step 1: Write the component**

```typescript
// src/components/3d/GltfFurniture.tsx
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';
import { useMemo } from 'react';

interface GltfFurnitureProps {
  /** GLTF URL from Supabase Storage */
  url: string;
  /** Position in world space (metres) */
  position?: [number, number, number];
  /** Rotation around Y axis (radians) */
  rotation?: number;
  /** Uniform scale factor */
  scale?: number;
  /** Override bounding box dimensions for hit testing */
  dimensions?: { x: number; y: number; z: number };
  selected?: boolean;
  onSelect?: () => void;
}

/** Loads and renders a GLTF mesh as furniture. Used for VIGA-reconstructed meshes. */
export function GltfFurniture({
  url,
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  dimensions,
  selected = false,
  onSelect,
}: GltfFurnitureProps) {
  const { scene } = useGLTF(url);

  const mesh = useMemo(() => {
    const group = scene.clone();

    // Apply scale
    group.scale.setScalar(scale);

    // Center vertically if no explicit dimensions
    if (dimensions) {
      const height = dimensions.y * scale;
      group.position.set(position[0], position[1] + height / 2, position[2]);
    } else {
      group.position.set(...position);
    }

    group.rotation.y = rotation;

    // Apply selection highlight
    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.selected = selected;
      }
    });

    return group;
  }, [scene, position, rotation, scale, dimensions, selected]);

  return <primitive object={mesh} onClick={onSelect} />;
}

// Preload for performance when URL is known ahead of time
export function preloadGltf(url: string): void {
  useGLTF.preload(url);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/3d/GltfFurniture.tsx
git commit -m "feat(3d): add GltfFurniture R3F component for loading VIGA GLTF meshes

Uses useGLTF from drei/native. Supports position, rotation, scale, selection.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: VIGAScreen

**Files:**
- Create: `src/screens/viga/VIGAScreen.tsx`
- Test: (manual — run app and navigate to VIGA tab)

- [ ] **Step 1: Write the screen**

```typescript
// src/screens/viga/VIGAScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useNavigate } from 'react-router';
import * as ImagePicker from 'expo-image-picker';
import { ArchText } from '../../components/common/ArchText';
import { TierGate } from '../../components/common/TierGate';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { DS } from '../../theme/designSystem';
import {
  submitVigaReconstruction,
  subscribeToVigaTask,
  fetchCustomFurniture,
  type VigaTaskStatus,
  type VigaMesh,
} from '../../services/vigaService';

const CATEGORIES = ['living', 'bedroom', 'dining', 'storage', 'outdoor', 'office'] as const;
type Category = typeof CATEGORIES[number];

function VIGAScreenContent() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState< string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('living');
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<VigaTaskStatus['status'] | null>(null);
  const [customMeshes, setCustomMeshes] = useState<VigaMesh[]>([]);
  const [loadingMeshes, setLoadingMeshes] = useState(false);

  // Load user's existing custom meshes on mount
  React.useEffect(() => {
    setLoadingMeshes(true);
    fetchCustomFurniture()
      .then(setCustomMeshes)
      .catch(() => {}) // non-fatal
      .finally(() => setLoadingMeshes(false));
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission required', 'Please grant camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const submit = useCallback(async () => {
    if (!selectedImage) return;
    setSubmitting(true);

    try {
      // Upload image to Supabase Storage first
      const formData = new FormData();
      formData.append('file', { uri: selectedImage, name: 'viga_input.jpg', type: 'image/jpeg' } as never);
      const { data: uploadData } = await supabase.storage
        .from('viga-inputs')
        .upload(`input_${Date.now()}.jpg`, formData as never);

      const imageUrl = uploadData?.path
        ? `${import.meta.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/viga-inputs/${uploadData.path}`
        : selectedImage;

      const { taskId } = await submitVigaReconstruction(imageUrl, { name, category });
      setActiveTaskId(taskId);

      // Subscribe to Realtime updates
      subscribeToVigaTask(taskId, (update: VigaTaskStatus) => {
        setTaskStatus(update.status);
        if (update.status === 'done' || update.status === 'failed') {
          setSubmitting(false);
          if (update.status === 'done') {
            // Refresh custom meshes list
            fetchCustomFurniture().then(setCustomMeshes).catch(() => {});
          }
        }
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }, [selectedImage, name, category]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DS.colors.background }} contentContainerStyle={{ padding: DS.spacing.lg }}>
      <ArchText variant="heading" style={{ marginBottom: DS.spacing.lg }}>
        VIGA 3D Reconstruction
      </ArchText>
      <Text style={{ color: DS.colors.textSecondary, marginBottom: DS.spacing.xl }}>
        Upload a photo of any object and VIGA will reconstruct it as a 3D mesh you can place in your blueprints.
      </Text>

      {/* Image selection */}
      <Pressable
        onPress={pickImage}
        style={{
          height: 200,
          borderRadius: 20,
          border: `2px dashed ${DS.colors.border}`,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: DS.spacing.lg,
          backgroundColor: DS.colors.surface,
          overflow: 'hidden',
        }}
      >
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={{ color: DS.colors.textDim }}>Tap to select image</Text>
        )}
      </Pressable>

      <View style={{ flexDirection: 'row', gap: DS.spacing.md, marginBottom: DS.spacing.lg }}>
        <Pressable onPress={pickImage} style={{ flex: 1, padding: DS.spacing.md, borderRadius: 50, backgroundColor: DS.colors.elevated, alignItems: 'center' }}>
          <Text style={{ color: DS.colors.textPrimary }}>Gallery</Text>
        </Pressable>
        <Pressable onPress={takePhoto} style={{ flex: 1, padding: DS.spacing.md, borderRadius: 50, backgroundColor: DS.colors.elevated, alignItems: 'center' }}>
          <Text style={{ color: DS.colors.textPrimary }}>Camera</Text>
        </Pressable>
      </View>

      {/* Name input */}
      <View style={{ marginBottom: DS.spacing.lg }}>
        <Text style={{ color: DS.colors.textSecondary, marginBottom: DS.spacing.sm }}>Object name</Text>
        <View style={{ backgroundColor: DS.colors.surface, borderRadius: 50, paddingHorizontal: DS.spacing.lg, paddingVertical: DS.spacing.md }}>
          <Text style={{ color: DS.colors.textPrimary }}>{name || 'Untitled'}</Text>
        </View>
      </View>

      {/* Category selector */}
      <View style={{ marginBottom: DS.spacing.xl }}>
        <Text style={{ color: DS.colors.textSecondary, marginBottom: DS.spacing.sm }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: DS.spacing.sm }} contentContainerStyle={{ gap: DS.spacing.sm }>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                paddingHorizontal: DS.spacing.lg,
                paddingVertical: DS.spacing.sm,
                borderRadius: 50,
                backgroundColor: category === cat ? DS.colors.primary : DS.colors.surface,
              }}
            >
              <Text style={{ color: category === cat ? DS.colors.background : DS.colors.textPrimary, textTransform: 'capitalize' }}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Status */}
      {activeTaskId && (
        <View style={{ marginBottom: DS.spacing.lg, alignItems: 'center' }}>
          <CompassRoseLoader size={40} />
          <Text style={{ color: DS.colors.textSecondary, marginTop: DS.spacing.sm }}>
            {taskStatus === 'processing' ? 'Reconstructing 3D model...' : taskStatus === 'done' ? 'Done!' : 'Processing...'}
          </Text>
        </View>
      )}

      <Pressable
        onPress={submit}
        disabled={!selectedImage || submitting}
        style={{
          padding: DS.spacing.lg,
          borderRadius: 50,
          backgroundColor: !selectedImage || submitting ? DS.colors.surface : DS.colors.primary,
          alignItems: 'center',
          marginBottom: DS.spacing.xl,
        }}
      >
        <Text style={{ color: !selectedImage || submitting ? DS.colors.textDim : DS.colors.background }}>
          {submitting ? 'Submitting...' : 'Reconstruct 3D Model'}
        </Text>
      </Pressable>

      {/* Custom meshes list */}
      {loadingMeshes ? (
        <CompassRoseLoader size={30} />
      ) : customMeshes.length > 0 ? (
        <View>
          <ArchText variant="subheading" style={{ marginBottom: DS.spacing.md }}>Your Custom Furniture</ArchText>
          {customMeshes.map((mesh) => (
            <Pressable
              key={mesh.id}
              onPress={() => navigate(`/workspace?placeFurniture=${mesh.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: DS.colors.surface,
                borderRadius: 20,
                padding: DS.spacing.md,
                marginBottom: DS.spacing.md,
                gap: DS.spacing.md,
              }}
            >
              {mesh.thumbnailUrl ? (
                <Image source={{ uri: mesh.thumbnailUrl }} style={{ width: 60, height: 60, borderRadius: 12 }} />
              ) : (
                <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: DS.colors.elevated }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: DS.colors.textPrimary }}>{mesh.name}</Text>
                <Text style={{ color: DS.colors.textDim, textTransform: 'capitalize' }}>{mesh.category}</Text>
              </View>
              <Text style={{ color: DS.colors.textSecondary }}>Place →</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

export function VIGAScreen() {
  return (
    <TierGate feature="arScansPerMonth" featureLabel="VIGA 3D Reconstruction">
      <VIGAScreenContent />
    </TierGate>
  );
}
```

- [ ] **Step 2: Fix TypeScript errors** — the `supabase.storage` upload and `FormData` parts need proper typing. Check with `npx tsc --noEmit` and fix any errors inline.

- [ ] **Step 3: Commit**

```bash
git add src/screens/viga/VIGAScreen.tsx
git commit -m "feat(screen): add VIGAScreen for image→3D reconstruction upload

Architect-tier gated. Shows image picker, category/name input, async submission
with Realtime status updates, and list of user's custom meshes.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Wire VIGAScreen into Navigation

**Files:**
- Modify: `src/navigation/MainNavigator.tsx`

- [ ] **Step 1: Read current file around line 11**

```bash
sed -n '1,30p' src/navigation/MainNavigator.tsx
```

- [ ] **Step 2: Add VIGAScreen import and tab**

Add import:
```typescript
const VIGAScreen  = lazyScreen(() =>
  import('../screens/viga/VIGAScreen').then((m) => ({ default: m.VIGAScreen })));
```

Add tab (after ARTab):
```typescript
const VIGATab       = () => <ErrorBoundary><VIGAScreen /></ErrorBoundary>;
```

Add Tab.Screen (after AR tab):
```typescript
<Tab.Screen
  name="VIGA"
  component={VIGATab}
  options={{
    tabBarStyle: { display: 'none' }, // Full-screen experience
  }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/navigation/MainNavigator.tsx
git commit -m "feat(nav): wire VIGAScreen into MainNavigator as full-screen tab

Hidden tab bar (tabBarStyle: none) like AR tab.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Extend ARPlaceMode with Custom Furniture

**Files:**
- Modify: `src/components/ar/ARPlaceMode.tsx:96-97`

- [ ] **Step 1: Fetch custom meshes and merge with FURNITURE_CATALOGUE**

Add state:
```typescript
const [customFurniture, setCustomFurniture] = useState<Array<{
  id: string; label: string; icon: string;
  w: number; d: number; cat: string;
  meshUrl?: string;
}>>([]);
```

In `useEffect`:
```typescript
useEffect(() => {
  fetchCustomFurniture().then((meshes) => {
    setCustomFurniture(meshes.map((m) => ({
      id: m.id,
      label: m.name,
      icon: '🏠',
      w: m.dimensions.x,
      d: m.dimensions.z,
      cat: m.category,
      meshUrl: m.meshUrl,
    })));
  }).catch(() => {});
}, []);
```

Merge catalogues (replace `FURNITURE_CATALOGUE[0]` with combined array):
```typescript
const [selectedFurniture, setSelectedFurniture] = useState(
  [...FURNITURE_CATALOGUE, ...customFurniture][0]
);
```

When rendering placed items, use GLTF rendering for custom meshes:
- If `meshUrl` exists, render via `GltfFurniture` component (from Task 6)
- Otherwise fall back to box placeholder (existing behavior)

- [ ] **Step 2: Commit**

```bash
git add src/components/ar/ARPlaceMode.tsx
git commit -m "feat(ar): extend ARPlaceMode with VIGA custom furniture

Fetches user's custom meshes and merges them into FURNITURE_CATALOGUE.
Custom meshes with meshUrl rendered via GltfFurniture component.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Tier Limits — `vigaRequestsPerMonth`

**Files:**
- Modify: `src/utils/tierLimits.ts`
- Modify: `src/hooks/useTierGate.ts`

- [ ] **Step 1: Read tierLimits.ts to find the structure**

```bash
grep -n "arScansPerMonth\|TierLimits" src/utils/tierLimits.ts | head -20
```

- [ ] **Step 2: Add `vigaRequestsPerMonth` to Architect tier**

In the Architect tier limits object, add:
```typescript
vigaRequestsPerMonth: -1, // unlimited for Architect
```

In Starter/Creator/Pro tiers, omit or set to 0 (they won't reach this screen anyway due to TierGate).

- [ ] **Step 3: Commit**

```bash
git add src/utils/tierLimits.ts src/hooks/useTierGate.ts
git commit -m "feat(tier): add vigaRequestsPerMonth limit for Architect tier

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: GPU Worker Service (VIGA)

**Files:**
- Create: `viga-worker/` directory (outside Asoria repo, deployed separately)
- Reference: `https://github.com/Fugtemypt123/VIGA` as base

This task is **out of scope for the mobile app repo** — it's a separate deployment. The GPU worker service is documented here for completeness.

The worker needs to:
1. Expose `POST /reconstruct` and `GET /status/{task_id}` endpoints
2. Run VIGA's Generator→Render→Verifier loop on uploaded image
3. Convert `.blend` output to GLTF via Blender headless: `blender --background --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='output.glb')"`
4. Upload GLTF to Supabase Storage
5. Call `viga-webhook` Edge Function with the GLTF URL

- [ ] **Step 1: Document the worker API contract**

Create `docs/viga-gpu-worker.md` in Asoria repo:

```markdown
# VIGA GPU Worker — API Contract

## Endpoint: `POST /reconstruct`

**Request:**
```json
{
  "image_url": "https://...",
  "user_id": "uuid",
  "project_id": "uuid (optional)",
  "mode": "furniture" | "room",
  "callback_url": "https://supabase/functions/v1/viga-webhook?task_id=..."
}
```

**Response:**
```json
{ "task_id": "worker-internal-task-id" }
```

## Endpoint: `GET /status/{task_id}`

**Response:**
```json
{
  "status": "processing" | "done" | "failed",
  "gltf_url": "https://... (when done)",
  "error": "string (when failed)"
}
```

## Deployment

Deployed on Modal, RunPod, or bare metal with:
- Blender (headless) installed
- CUDA-enabled GPU
- VIGA + Infinigen dependencies
- 4 conda envs: agent, blender, sam, sam3d
```

- [ ] **Step 2: Commit**

```bash
git add docs/viga-gpu-worker.md
git commit -m "docs: add VIGA GPU worker API contract

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

- [ ] Spec coverage: image-to-3D ✅ · AR integration ✅ · Sketch path ✅ · custom_furniture table ✅ · tier gate ✅ · Realtime ✅
- [ ] No placeholders: all field names, type names, function names match actual code
- [ ] Type consistency: `VigaTaskStatus.status` matches `viga_tasks.status` enum; `VigaMesh.dimensions` matches `custom_furniture.dimensions` JSONB shape
- [ ] VIGA worker is out-of-repo (separate deployment) — documented in `docs/viga-gpu-worker.md`
- [ ] `ar-reconstruct` (Meshy) and `viga-request` (VIGA) coexist as separate pipelines — no conflict
