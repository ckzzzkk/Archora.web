// Augment React.JSX.IntrinsicElements with R3F Three.js primitives.
// @types/react declares JSX inside `declare namespace React { namespace JSX {...} }`,
// so this file must augment that same namespace. No imports — pure ambient script.

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      mesh: {
        key?: React.Key;
        position?: [number, number, number];
        rotation?: [number, number, number];
        castShadow?: boolean;
        receiveShadow?: boolean;
        children?: React.ReactNode;
        onClick?: () => void;
      };
      group: {
        key?: React.Key;
        position?: [number, number, number];
        rotation?: [number, number, number];
        children?: React.ReactNode;
      };
      boxGeometry: { args?: [number, number, number] };
      planeGeometry: { args?: [number, number] };
      cylinderGeometry: { args?: [number, number, number, number] };
      sphereGeometry: { args?: [number, number, number] };
      meshStandardMaterial: {
        color?: string;
        roughness?: number;
        metalness?: number;
        transparent?: boolean;
        opacity?: number;
      };
      meshLambertMaterial: { color?: string };
      ambientLight: { intensity?: number; color?: string };
      directionalLight: {
        position?: [number, number, number];
        intensity?: number;
        color?: string;
        castShadow?: boolean;
      };
      pointLight: {
        position?: [number, number, number];
        intensity?: number;
        distance?: number;
      };
      perspectiveCamera: {
        position?: [number, number, number];
        fov?: number;
        makeDefault?: boolean;
      };
    }
  }
}
