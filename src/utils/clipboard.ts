/**
 * 统一的剪贴板写入能力（全应用唯一入口）。
 *
 * 判断顺序固定：
 * 1. 安全上下文下优先使用异步 Clipboard API（navigator.clipboard.writeText）；
 * 2. 剪贴板 API 不可用（如 HTTP 非安全上下文、老旧浏览器、权限被拒或调用抛错）时，
 *    回退到隐藏 textarea + document.execCommand('copy')。
 *
 * 任何分支都不会抛错：调用方只需根据布尔结果决定成功/失败表现，
 * 失败后再次点击会重新走一遍完整判断，可直接重试。
 *
 * @param text 要复制的文本
 * @returns 是否复制成功
 */
export async function copyText(text: string): Promise<boolean> {
  if (isClipboardApiAvailable()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 权限拒绝或临时不可用，继续走 execCommand 回退
    }
  }

  return copyWithExecCommand(text);
}

/**
 * 剪贴板 API 是否可用。
 * 非安全上下文（如 http://）下部分浏览器即使暴露了 clipboard 对象，
 * 调用也必然失败，因此直接判定为不可用、走回退方案。
 */
function isClipboardApiAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function' &&
    (typeof window === 'undefined' || window.isSecureContext !== false)
  );
}

/**
 * 回退方案：选中隐藏的 textarea 后执行 execCommand('copy')。
 */
function copyWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch {
    succeeded = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return succeeded;
}
