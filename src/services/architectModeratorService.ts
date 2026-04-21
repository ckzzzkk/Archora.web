// architectModeratorService.ts
// Feeds Codesign session events to the Architect Agent context

import { supabase } from '../lib/supabase';
import type { BlueprintData } from '../types/blueprint';
import type { Participant } from '../stores/codesignStore';

export interface SessionEvent {
  sessionId?: string;
  type: 'cursor_move' | 'wall_add' | 'wall_delete' | 'furniture_add' | 'room_edit' | 'participant_join' | 'participant_leave';
  userId: string;
  timestamp: number;
  payload: unknown;
}

export interface ArchitectSuggestion {
  id: string;
  type: 'design_tip' | 'structural_warning' | 'conflict_alert' | 'improvement_idea';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  relatedEntityIds: string[];
  createdAt: string;
}

export interface AnalyzeContext {
  blueprint: BlueprintData;
  recentEvents: SessionEvent[];
  participants: Participant[];
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Rolling window of recent events per session (max 20)
const recentEventsMap = new Map<string, SessionEvent[]>();

function pushEvent(sessionId: string, event: SessionEvent): SessionEvent[] {
  const existing = recentEventsMap.get(sessionId) ?? [];
  const updated = [...existing, event].slice(-20);
  recentEventsMap.set(sessionId, updated);
  return updated;
}

function getRecentEvents(sessionId: string): SessionEvent[] {
  return recentEventsMap.get(sessionId) ?? [];
}

// Suggestions stored per session
const sessionSuggestions = new Map<string, ArchitectSuggestion[]>();

export function getSessionSuggestions(sessionId: string): ArchitectSuggestion[] {
  return sessionSuggestions.get(sessionId) ?? [];
}

export function clearSessionSuggestions(sessionId: string): void {
  sessionSuggestions.delete(sessionId);
  recentEventsMap.delete(sessionId);
}

function buildBlueprintSummary(blueprint: BlueprintData): string {
  const floor = blueprint.floors[0];
  if (!floor) return 'No floor data';
  return [
    `Building: ${blueprint.metadata?.buildingType ?? 'unknown'}, style: ${blueprint.metadata?.style ?? 'unknown'}`,
    `Floors: ${blueprint.floors.length}, Total area: ${blueprint.metadata?.totalArea ?? 0}m²`,
    `Walls: ${floor.walls.length}, Rooms: ${floor.rooms.length}`,
    `Furniture pieces: ${floor.furniture.length}`,
    `Openings: ${floor.openings.length}`,
    floor.staircases.length ? `Staircases: ${floor.staircases.length}` : null,
    floor.roofs.length ? `Roofs: ${floor.roofs.length}` : null,
  ].filter(Boolean).join('\n');
}

function buildEventSummary(events: SessionEvent[]): string {
  return events.map(e => {
    const time = new Date(e.timestamp).toLocaleTimeString();
    const user = e.userId.slice(0, 8);
    const payloadPreview = JSON.stringify(e.payload).slice(0, 120);
    return `[${time}] ${e.type} by ${user}: ${payloadPreview}`;
  }).join('\n');
}

export async function analyzeSessionEvent(
  event: SessionEvent,
  context: AnalyzeContext,
): Promise<ArchitectSuggestion[]> {
  const { blueprint, participants } = context;
  const sessionId = event.sessionId ?? crypto.randomUUID?.() ?? String(Date.now());
  const recentEvents = pushEvent(sessionId, event);

  // Build prompt for the Architect Agent
  const systemPrompt = `You are the Architect Agent — a senior building designer AI assistant embedded in a live Codesign session. Your role is to watch all participant actions in real time and provide helpful design suggestions, structural warnings, and conflict alerts.

RULES:
- Be concise — suggestions must fit in 1-3 sentences
- Focus on practical, actionable feedback
- Mark critical issues clearly
- When there is nothing notable, return an empty array (no suggestion)
- Respond in JSON format: { "suggestions": [{ "type": "design_tip"|"structural_warning"|"conflict_alert"|"improvement_idea", "severity": "info"|"warning"|"critical", "message": "...", "relatedEntityIds": [] }] }
- relatedEntityIds should be any wall/furniture/room IDs mentioned in the suggestion (can be empty)`;

  const blueprintSummary = buildBlueprintSummary(blueprint);
  const eventSummary = buildEventSummary(recentEvents.slice(-20));
  const participantSummary = participants.map(p => `${p.displayName} (${p.userId.slice(0, 8)})`).join(', ');

  const userPrompt = `## Current Event
Type: ${event.type}
User: ${event.userId.slice(0, 8)}
Timestamp: ${new Date(event.timestamp).toISOString()}
Payload: ${JSON.stringify(event.payload, null, 2)}

## Current Blueprint State
${blueprintSummary}

## Recent Session Events (last 20)
${eventSummary || '(none yet)'}

## Active Participants
${participantSummary || 'Only you (Architect Agent)'}

## Your Task
Analyze the current event in context of the blueprint and recent events. Return any suggestions for the design team. If nothing needs attention, return an empty suggestions array.`;

  try {
    const headers = await getAuthHeader();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-architect-chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tier: 'Architect',
        architectId: null,
        conversationHistory: [
          { id: '1', role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
          { id: '2', role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
        ],
        currentPayload: {},
        sessionId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[architectModerator] AI request failed:', response.status);
      return [];
    }

    const data = await response.json() as {
      message?: string;
      architectInsights?: string[];
    };

    const insights = data.architectInsights ?? [];

    if (insights.length === 0) return [];

    const suggestions: ArchitectSuggestion[] = insights.map((msg, i) => ({
      id: `${sessionId}-${event.timestamp}-${i}`,
      type: classifySuggestion(msg),
      severity: assessSeverity(msg),
      message: msg,
      relatedEntityIds: extractEntityIds(msg),
      createdAt: new Date().toISOString(),
    }));

    // Append to session store
    const existing = sessionSuggestions.get(sessionId) ?? [];
    sessionSuggestions.set(sessionId, [...existing, ...suggestions]);

    return suggestions;
  } catch (err) {
    console.warn('[architectModerator] analyzeSessionEvent error:', err);
    return [];
  }
}

function classifySuggestion(message: string): ArchitectSuggestion['type'] {
  const lower = message.toLowerCase();
  if (lower.includes('structural') || lower.includes('load') || lower.includes('foundation')) return 'structural_warning';
  if (lower.includes('conflict') || lower.includes('overlap') || lower.includes('duplicate')) return 'conflict_alert';
  if (lower.includes('improve') || lower.includes('should') || lower.includes('consider')) return 'improvement_idea';
  return 'design_tip';
}

function assessSeverity(message: string): ArchitectSuggestion['severity'] {
  const lower = message.toLowerCase();
  if (lower.includes('critical') || lower.includes('unsafe') || lower.includes('collapse')) return 'critical';
  if (lower.includes('warning') || lower.includes('check') || lower.includes('ensure')) return 'warning';
  return 'info';
}

function extractEntityIds(message: string): string[] {
  // Simple regex to find potential UUIDs or IDs in the message
  const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
  const idRegex = /\b(wall|room|furniture|roof|opening)[-_]?[a-z0-9]{4,}/gi;
  const matches = message.match(uuidRegex) ?? [];
  const idMatches = message.match(idRegex) ?? [];
  return [...new Set([...matches, ...idMatches])];
}
