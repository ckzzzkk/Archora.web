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
        scale?: [number, number, number] | number;
        castShadow?: boolean;
        receiveShadow?: boolean;
        children?: React.ReactNode;
        onClick?: () => void;
      };
      group: {
        key?: React.Key;
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number] | number;
        children?: React.ReactNode;
      };
      boxGeometry: { args?: [number, number, number] };
      planeGeometry: { args?: [number, number] };
      cylinderGeometry: { args?: [number?, number?, number?, number?, number?, boolean?, number?, number?] };
      sphereGeometry: { args?: [number, number, number] };
      coneGeometry: { args?: [number, number, number] };
      torusGeometry: { args?: [number, number, number, number] };
      ringGeometry: { args?: [number, number, number] };
      meshStandardMaterial: {
        color?: string;
        roughness?: number;
        metalness?: number;
        transparent?: boolean;
        opacity?: number;
        wireframe?: boolean;
        emissive?: string;
        emissiveIntensity?: number;
        side?: number;
        depthWrite?: boolean;
      };
      meshLambertMaterial: { color?: string; emissive?: string };
      meshBasicMaterial: { color?: string; wireframe?: boolean; transparent?: boolean; opacity?: number };
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
        color?: string;
      };
      spotLight: {
        position?: [number, number, number];
        intensity?: number;
        angle?: number;
        penumbra?: number;
        castShadow?: boolean;
        color?: string;
      };
      perspectiveCamera: {
        position?: [number, number, number];
        fov?: number;
        makeDefault?: boolean;
      };
    }
  }
}
