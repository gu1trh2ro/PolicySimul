declare module "react" {
  export type ReactNode = any;
  export function useState<S>(initialState: S): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  const React: any;
  export default React;
}


