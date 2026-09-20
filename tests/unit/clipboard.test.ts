import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyTextToClipboard } from '../../src/utils/clipboard';

function stubClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

function stubExecCommand(result: boolean) {
  const execCommand = vi.fn().mockReturnValue(result);
  document.execCommand = execCommand;
  return execCommand;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('copyTextToClipboard', () => {
  it('Clipboard API 可用时直接写入，不走回退方案', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const execCommand = stubExecCommand(true);

    await copyTextToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(execCommand).not.toHaveBeenCalled();
  });

  it('Clipboard API 不可用时回退到 execCommand', async () => {
    stubClipboard(undefined);
    const execCommand = stubExecCommand(true);

    await copyTextToClipboard('fallback');

    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('Clipboard API 调用被拒绝时回退到 execCommand', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const execCommand = stubExecCommand(true);

    await copyTextToClipboard('retry-with-fallback');

    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('两条路径都失败时抛出错误', async () => {
    stubClipboard(undefined);
    stubExecCommand(false);

    await expect(copyTextToClipboard('cannot-copy')).rejects.toThrow();
  });
});
