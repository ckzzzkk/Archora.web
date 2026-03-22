// Module declarations for packages used at runtime but not yet listed in package.json.
// These keep `tsc --noEmit` clean while the native packages are resolved by Metro/Expo.

declare module '@shopify/react-native-skia' {
  import type { ComponentType, ReactNode } from 'react';
  import type { ViewStyle } from 'react-native';

  export interface SkPoint { x: number; y: number; }
  export interface SkFont {}
  export interface SkPath {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    close(): void;
    addRect(rect: { x: number; y: number; width: number; height: number }): void;
  }
  export interface SkPaint {}

  export const Skia: {
    Path: {
      Make(): SkPath;
      (arg?: unknown): SkPath;
    };
    Paint: () => SkPaint;
    Font: (typeface: unknown, size: number) => SkFont;
  };

  export interface CanvasProps { style?: ViewStyle; children?: ReactNode; }
  export const Canvas: ComponentType<CanvasProps>;

  export interface LineProps { p1: SkPoint; p2: SkPoint; color: string; strokeWidth?: number; opacity?: number; }
  export const Line: ComponentType<LineProps>;

  export interface CircleProps { cx: number; cy: number; r: number; color: string; opacity?: number; }
  export const Circle: ComponentType<CircleProps>;

  export interface PathProps { path: string | SkPath; color: string; style?: 'fill' | 'stroke'; strokeWidth?: number; opacity?: number; children?: ReactNode; }
  export const Path: ComponentType<PathProps>;

  export interface TextProps { x: number; y: number; text: string; color: string; font: SkFont | null; }
  export const Text: ComponentType<TextProps>;

  export interface GroupProps { children?: ReactNode; opacity?: number; transform?: { translateX?: number; translateY?: number; scale?: number }[]; }
  export const Group: ComponentType<GroupProps>;

  export interface PaintProps { color?: string; }
  export const Paint: ComponentType<PaintProps>;

  export interface DashPathEffectProps { intervals: number[]; phase?: number; }
  export const DashPathEffect: ComponentType<DashPathEffectProps>;

  export function useFont(asset: unknown, size?: number): SkFont | null;
  export function useValue<T>(initial: T): { current: T };
  export function useSharedValueEffect(cb: () => void, ...deps: unknown[]): void;
}

declare module '@react-three/fiber/native' {
  import type { ComponentType, ReactNode } from 'react';
  import type { ViewStyle } from 'react-native';
  import type * as THREE from 'three';

  export interface CanvasProps {
    style?: ViewStyle;
    children?: ReactNode;
    camera?: { position?: [number, number, number]; fov?: number; near?: number; far?: number };
    shadows?: boolean;
    gl?: Record<string, unknown>;
    onCreated?: (state: RootState) => void;
  }
  export const Canvas: ComponentType<CanvasProps>;

  export interface RootState {
    camera: THREE.Camera;
    scene: THREE.Scene;
    gl: THREE.WebGLRenderer;
  }

  export function useThree(): RootState;
  export function useFrame(cb: (state: RootState, delta: number) => void, priority?: number): void;
  export function extend(objects: Record<string, unknown>): void;

  // JSX intrinsic element overrides for Three.js objects
  namespace JSX {
    interface IntrinsicElements {
      mesh: { position?: [number, number, number]; rotation?: [number, number, number]; castShadow?: boolean; receiveShadow?: boolean; children?: ReactNode };
      boxGeometry: { args?: [number, number, number] };
      planeGeometry: { args?: [number, number] };
      cylinderGeometry: { args?: [number, number, number, number] };
      sphereGeometry: { args?: [number, number, number] };
      meshStandardMaterial: { color?: string; roughness?: number; metalness?: number; transparent?: boolean; opacity?: number };
      meshLambertMaterial: { color?: string };
      ambientLight: { intensity?: number; color?: string };
      directionalLight: { position?: [number, number, number]; intensity?: number; castShadow?: boolean };
      pointLight: { position?: [number, number, number]; intensity?: number; distance?: number };
      group: { position?: [number, number, number]; rotation?: [number, number, number]; children?: ReactNode };
      perspectiveCamera: { position?: [number, number, number]; fov?: number; makeDefault?: boolean };
    }
  }
}

declare module '@react-three/drei/native' {
  import type { ComponentType, ReactNode } from 'react';
  import type * as THREE from 'three';

  export interface OrbitControlsProps {
    enableZoom?: boolean; enablePan?: boolean; enableRotate?: boolean;
    minDistance?: number; maxDistance?: number; maxPolarAngle?: number;
    target?: [number, number, number];
  }
  export const OrbitControls: ComponentType<OrbitControlsProps>;

  export interface Environment { preset?: string; }
  export const Environment: ComponentType<Environment>;

  export interface SkyProps { sunPosition?: [number, number, number]; }
  export const Sky: ComponentType<SkyProps>;

  export interface GridProps { args?: [number, number]; cellColor?: string; sectionColor?: string; }
  export const Grid: ComponentType<GridProps>;

  export interface TextProps { color?: string; fontSize?: number; children?: ReactNode; position?: [number, number, number]; }
  export const Text: ComponentType<TextProps>;

  export function useTexture(url: string): THREE.Texture;
}

// three.js types are provided by @types/three (installed as devDependency)

// @react-native-community/netinfo — real package installed, types from package
// @react-navigation/* — real packages installed, types from packages

declare module 'expo-router' {
  export function useRouter(): { push: (route: string) => void; back: () => void; replace: (route: string) => void };
  export function useLocalSearchParams<T = Record<string, string>>(): T;
  export function useFocusEffect(cb: () => void | (() => void)): void;
  export function useNavigation(): unknown;
  export const Link: import('react').ComponentType<{ href: string; children?: import('react').ReactNode; asChild?: boolean }>;
  export const Redirect: import('react').ComponentType<{ href: string }>;
  export const Slot: import('react').ComponentType;
  export const Stack: import('react').ComponentType<{ screenOptions?: unknown; children?: import('react').ReactNode }> & {
    Screen: import('react').ComponentType<{ name: string; options?: unknown }>;
  };
  export const Tabs: import('react').ComponentType<{ screenOptions?: unknown; children?: import('react').ReactNode }> & {
    Screen: import('react').ComponentType<{ name: string; options?: unknown }>;
  };
}

// Ensure JSX intrinsics from R3F are recognised throughout the app
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: unknown;
      boxGeometry: unknown;
      planeGeometry: unknown;
      cylinderGeometry: unknown;
      sphereGeometry: unknown;
      meshStandardMaterial: unknown;
      meshLambertMaterial: unknown;
      ambientLight: unknown;
      directionalLight: unknown;
      pointLight: unknown;
      group: unknown;
      perspectiveCamera: unknown;
    }
  }
}
