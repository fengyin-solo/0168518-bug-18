/**
 * 将文本写入剪贴板
 * 优先使用 Clipboard API，不可用或调用失败时回退到 execCommand
 * 两条路径都失败时抛出错误，由调用方统一处理
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Clipboard API 被拒绝时继续尝试回退方案
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const succeeded = document.execCommand('copy');
    if (!succeeded) {
      throw new Error('document.execCommand("copy") returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
