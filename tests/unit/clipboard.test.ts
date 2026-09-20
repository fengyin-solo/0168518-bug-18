import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { copyText } from '../../src/utils/clipboard'

const TEXT = '需要复制的内容'

type ClipboardMock = {
  writeText: ReturnType<typeof vi.fn>
}

function defineClipboard(clipboard: ClipboardMock | undefined) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
    writable: true,
  })
}

function defineSecureContext(value: boolean) {
  Object.defineProperty(window, 'isSecureContext', {
    value,
    configurable: true,
  })
}

/** 模拟 execCommand 回退方案依赖的 DOM API */
function mockExecCommand(succeed: boolean) {
  const selectionMock = { removeAllRanges: vi.fn(), selectAllChildren: vi.fn() }
  const originalSelection = window.getSelection
  window.getSelection = vi.fn(() => selectionMock as unknown as Selection)

  const originalExecCommand = document.execCommand
  document.execCommand = vi.fn(() => succeed)

  return () => {
    window.getSelection = originalSelection
    document.execCommand = originalExecCommand
  }
}

describe('copyText', () => {
  beforeEach(() => {
    defineSecureContext(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('剪贴板 API 可用时直接写入并返回 true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    defineClipboard({ writeText })

    await expect(copyText(TEXT)).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith(TEXT)
  })

  it('剪贴板 API 抛错时回退 execCommand，成功返回 true', async () => {
    defineClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) })
    const restore = mockExecCommand(true)

    const result = await copyText(TEXT)

    expect(result).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    restore()
  })

  it('非安全上下文（navigator.clipboard 缺失）时回退 execCommand', async () => {
    defineClipboard(undefined)
    const restore = mockExecCommand(true)

    const result = await copyText(TEXT)

    expect(result).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    restore()
  })

  it('被判定为非安全上下文时即使存在 clipboard 对象也直接回退', async () => {
    defineSecureContext(false)
    const writeText = vi.fn()
    defineClipboard({ writeText })
    const restore = mockExecCommand(true)

    const result = await copyText(TEXT)

    expect(result).toBe(true)
    expect(writeText).not.toHaveBeenCalled()
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    restore()
  })

  it('两条路径都失败时返回 false 且不抛错，允许调用方重试', async () => {
    defineClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    const restore = mockExecCommand(false)

    await expect(copyText(TEXT)).resolves.toBe(false)
    restore()
  })

  it('所有剪贴板能力都不可用时返回 false', async () => {
    defineClipboard(undefined)
    const originalExecCommand = document.execCommand
    // @ts-expect-error 模拟 execCommand 不存在的极端环境
    document.execCommand = undefined

    await expect(copyText(TEXT)).resolves.toBe(false)

    document.execCommand = originalExecCommand
  })

  it('execCommand 自身抛错时被吞掉并返回 false', async () => {
    defineClipboard(undefined)
    const originalExecCommand = document.execCommand
    document.execCommand = vi.fn(() => {
      throw new Error('boom')
    })

    await expect(copyText(TEXT)).resolves.toBe(false)

    document.execCommand = originalExecCommand
  })
})
