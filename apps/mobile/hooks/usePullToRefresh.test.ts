import { act, renderHook } from '@testing-library/react-native';

import { usePullToRefresh } from './usePullToRefresh';

describe('usePullToRefresh', () => {
  it('is refreshing only while a pull is in progress', async () => {
    let finish: () => void = () => {};
    const refresh = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => usePullToRefresh(refresh));

    expect(result.current.refreshing).toBe(false);

    let pull: Promise<void> = Promise.resolve();
    act(() => {
      pull = result.current.onRefresh();
    });
    expect(result.current.refreshing).toBe(true);

    await act(async () => {
      finish();
      await pull;
    });
    expect(result.current.refreshing).toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('stops refreshing and logs when the refresh fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() =>
      usePullToRefresh(() => Promise.reject(new Error('offline')))
    );

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(result.current.refreshing).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
