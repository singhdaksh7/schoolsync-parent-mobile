// Minimal renderHook harness using react-test-renderer (already present via
// the RN toolchain — no @testing-library/react-native dependency added).
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

export function renderHook<T>(useHookFn: () => T, options?: { wrapper?: React.ComponentType<{ children: React.ReactNode }> }) {
  let value: T;
  function TestComponent() {
    value = useHookFn();
    return null;
  }

  const Wrapper = options?.wrapper;
  const element = Wrapper ? React.createElement(Wrapper, null, React.createElement(TestComponent)) : React.createElement(TestComponent);

  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(element);
  });

  return {
    get result() {
      return value;
    },
    act: (callback: () => void | Promise<void>) => act(callback as () => void),
    unmount: () => act(() => renderer.unmount()),
  };
}
