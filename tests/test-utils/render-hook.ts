// Minimal renderHook harness using react-test-renderer (already present via
// the RN toolchain — no @testing-library/react-native dependency added).
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

export function renderHook<T>(useHookFn: () => T) {
  let value: T;
  function TestComponent() {
    value = useHookFn();
    return null;
  }

  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(React.createElement(TestComponent));
  });

  return {
    get result() {
      return value;
    },
    act: (callback: () => void | Promise<void>) => act(callback as () => void),
    unmount: () => act(() => renderer.unmount()),
  };
}
