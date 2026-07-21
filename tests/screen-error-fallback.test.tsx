import React from 'react';
import { act, create } from 'react-test-renderer';
import { ScreenErrorFallback } from '@/components/ScreenErrorFallback';

describe('ScreenErrorFallback — error boundary UI', () => {
  it('shows the generic message and never a stack trace or error detail', () => {
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(<ScreenErrorFallback onRetry={() => undefined} onSignOut={() => undefined} />);
    });

    const text = JSON.stringify(renderer.toJSON());
    expect(text).toContain("SchoolSync couldn't load this screen.");
    // Must never leak implementation detail — no stack, no "Error:", no bearer/token wording.
    expect(text).not.toMatch(/at .*\(.*:\d+:\d+\)/);
    expect(text.toLowerCase()).not.toContain('token');
  });

  it('Try Again invokes onRetry, Sign Out invokes onSignOut', () => {
    const onRetry = jest.fn();
    const onSignOut = jest.fn();
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(<ScreenErrorFallback onRetry={onRetry} onSignOut={onSignOut} />);
    });

    const pressables = renderer.root.findAll((node) => typeof node.props.onPress === 'function');
    expect(pressables).toHaveLength(2);

    act(() => pressables[0].props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSignOut).not.toHaveBeenCalled();

    act(() => pressables[1].props.onPress());
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
