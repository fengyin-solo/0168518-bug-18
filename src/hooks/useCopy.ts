import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { copyTextToClipboard } from '../utils/clipboard';

/** 复制提示统一使用的 key，连续复制时更新同一条提示而不是堆叠 */
const COPY_MESSAGE_KEY = 'copy-feedback';

const DEFAULT_SUCCESS_TEXT = '已复制';
const DEFAULT_ERROR_TEXT = '复制失败，请重试';
const DEFAULT_RESET_DELAY = 2000;

interface UseCopyOptions {
  /** 复制成功后的提示文本 */
  successText?: string;
  /** 复制失败后的提示文本 */
  errorText?: string;
  /** 复制状态重置时间（毫秒） */
  resetDelay?: number;
}

interface UseCopyResult {
  /** 是否处于已复制状态 */
  copied: boolean;
  /** 执行复制，返回是否成功；失败后可再次调用重试 */
  copy: (text: string) => Promise<boolean>;
}

/**
 * 复制到剪贴板的通用 Hook
 * 所有复制入口共用同一套成功/失败提示
 */
export function useCopy({
  successText = DEFAULT_SUCCESS_TEXT,
  errorText = DEFAULT_ERROR_TEXT,
  resetDelay = DEFAULT_RESET_DELAY,
}: UseCopyOptions = {}): UseCopyResult {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await copyTextToClipboard(text);
        setCopied(true);
        message.success({ content: successText, key: COPY_MESSAGE_KEY });

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelay);
        return true;
      } catch (error) {
        console.error('Failed to copy:', error);
        // 失败时不进入已复制状态，可以再次点击重试
        setCopied(false);
        message.error({ content: errorText, key: COPY_MESSAGE_KEY });
        return false;
      }
    },
    [successText, errorText, resetDelay]
  );

  return { copied, copy };
}
