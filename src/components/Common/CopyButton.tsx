import { useState, useCallback, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';
import { copyText } from '../../utils/clipboard';

/** 全局统一的消息 key，保证同一时刻只有一条复制相关提示 */
const COPY_MESSAGE_KEY = 'app-copy-feedback';

/** 复制成功/失败提示文案，所有入口保持一致 */
const DEFAULT_BUTTON_TEXT = '复制';
const DEFAULT_SUCCESS_TEXT = '已复制';
const DEFAULT_ERROR_TEXT = '复制失败，请重试';

interface CopyButtonProps {
  /** 要复制的文本 */
  text: string;
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 按钮类型，默认使用无边框文本按钮 */
  type?: ButtonProps['type'];
  /** 自定义类名 */
  className?: string;
  /** 按钮与 Tooltip 的默认文案（复制成功后不会变化，避免重复提示） */
  buttonText?: string;
  /** 复制成功后的全局提示文本 */
  successText?: string;
  /** 复制失败后的全局提示文本 */
  errorText?: string;
  /** 是否显示文字，显示时 Tooltip 自动关闭 */
  showText?: boolean;
  /** 是否阻止点击事件冒泡（如卡片列表中使用） */
  stopPropagation?: boolean;
}

/**
 * 复制按钮组件（全应用唯一的复制入口）
 *
 * - 成功：按钮短暂变为对勾，同时只弹一条成功提示；
 * - 失败：只弹一条失败提示，按钮保持可点，再次点击即可重试；
 * - 剪贴板 API 不可用时自动回退 execCommand，不会出现点不动的情况。
 */
export function CopyButton({
  text,
  size = 'middle',
  type = 'text',
  className = '',
  buttonText = DEFAULT_BUTTON_TEXT,
  successText = DEFAULT_SUCCESS_TEXT,
  errorText = DEFAULT_ERROR_TEXT,
  showText = false,
  stopPropagation = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // 复制目标变化（如流式输出更新）时清理上一次的成功状态
  useEffect(() => {
    setCopied(false);
  }, [text]);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(text);

    if (ok) {
      setCopied(true);
      message.success({ key: COPY_MESSAGE_KEY, content: successText });
    } else {
      // 不锁定按钮、不进入对勾状态，用户可立即再次点击重试
      setCopied(false);
      message.error({ key: COPY_MESSAGE_KEY, content: errorText });
    }
  }, [text, successText, errorText]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (stopPropagation) {
        event.stopPropagation();
      }
      void handleCopy();
    },
    [handleCopy, stopPropagation],
  );

  const button = (
    <Button
      type={type}
      size={size}
      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
      onClick={handleClick}
      className={`copy-button ${copied ? 'copied' : ''} ${className}`}
      style={{
        color: copied ? 'var(--color-success)' : undefined,
      }}
    >
      {showText && buttonText}
    </Button>
  );

  // 文案已经显示在按钮上时不再叠加 Tooltip，避免同一内容出现两处提示
  if (showText) {
    return button;
  }

  return <Tooltip title={buttonText}>{button}</Tooltip>;
}
