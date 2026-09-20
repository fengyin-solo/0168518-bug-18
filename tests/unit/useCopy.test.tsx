import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { message } from 'antd';
import { useCopy } from '../../src/hooks/useCopy';
import { copyTextToClipboard } from '../../src/utils/clipboard';

vi.mock('../../src/utils/clipboard', () => ({
  copyTextToClipboard: vi.fn(),
}));

const mockCopyText = vi.mocked(copyTextToClipboard);

describe('useCopy', () => {
  let successSpy: MockInstance<typeof message.success>;
  let errorSpy: MockInstance<typeof message.error>;

  beforeEach(() => {
    mockCopyText.mockReset();
    successSpy = vi
      .spyOn(message, 'success')
      .mockImplementation((() => undefined) as never);
    errorSpy = vi
      .spyOn(message, 'error')
      .mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('复制成功时只弹出一条成功提示', async () => {
    mockCopyText.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCopy());

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.copy('hello');
    });

    expect(succeeded).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(successSpy).toHaveBeenCalledWith(
      expect.objectContaining({ content: '已复制' })
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('连续复制时提示使用同一个 key，不会堆叠多条', async () => {
    mockCopyText.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCopy());

    await act(async () => {
      await result.current.copy('first');
    });
    await act(async () => {
      await result.current.copy('second');
    });

    expect(successSpy).toHaveBeenCalledTimes(2);
    for (const call of successSpy.mock.calls) {
      expect(call[0]).toEqual(
        expect.objectContaining({ key: 'copy-feedback' })
      );
    }
  });

  it('已复制状态在重置时间后恢复', async () => {
    vi.useFakeTimers();
    mockCopyText.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCopy());

    await act(async () => {
      await result.current.copy('hello');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it('复制失败时只弹出一条失败提示，且可以重试', async () => {
    mockCopyText.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useCopy());

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.copy('hello');
    });

    expect(succeeded).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ content: '复制失败，请重试' })
    );
    expect(successSpy).not.toHaveBeenCalled();

    // 失败后再次复制可以成功
    mockCopyText.mockResolvedValueOnce(undefined);
    await act(async () => {
      succeeded = await result.current.copy('hello');
    });

    expect(succeeded).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(successSpy).toHaveBeenCalledTimes(1);
  });

  it('成功提示文本可以自定义，各处入口保持一致', async () => {
    mockCopyText.mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCopy({ successText: '模板内容已复制' })
    );

    await act(async () => {
      await result.current.copy('template');
    });

    expect(successSpy).toHaveBeenCalledWith(
      expect.objectContaining({ content: '模板内容已复制' })
    );
  });
});
