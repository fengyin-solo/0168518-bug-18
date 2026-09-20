import { Button, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useCopy } from '../../hooks/useCopy';

interface CopyButtonProps {
  /** 要复制的文本 */
  text: string;
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 自定义类名 */
  className?: string;
  /** 复制成功后的提示文本 */
  successText?: string;
  /** 是否显示文字 */
  showText?: boolean;
}

/**
 * 复制按钮组件
 * 点击后将文本复制到剪贴板
 */
export function CopyButton({
  text,
  size = 'middle',
  className = '',
  successText = '已复制',
  showText = false,
}: CopyButtonProps) {
  const { copied, copy } = useCopy({ successText });

  return (
    <Tooltip title="复制">
      <Button
        type="text"
        size={size}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={() => copy(text)}
        className={`copy-button ${copied ? 'copied' : ''} ${className}`}
        style={{
          color: copied ? 'var(--color-success)' : undefined,
        }}
      >
        {showText && (copied ? successText : '复制')}
      </Button>
    </Tooltip>
  );
}
