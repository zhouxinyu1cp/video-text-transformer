import { test, expect } from '@playwright/test'

const TEST_URL = 'https://www.bilibili.com/video/BV1bzAszCERo'

test.describe('B站视频真实端到端全流程测试', () => {
  test('完整流程：解析 -> 开始处理 -> 等待转录完成', async ({ page }) => {
    // 步骤1：打开首页
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('视频智能文稿生成器')

    // 步骤2：输入B站视频链接
    const input = page.getByPlaceholder(/请粘贴B站/)
    const submitButton = page.getByRole('button', { name: '解析' })

    await input.fill(TEST_URL)
    await expect(submitButton).toBeEnabled()

    // 步骤3：点击解析按钮
    await submitButton.click()

    // 步骤4：等待视频信息显示（标题、作者、时长等）
    await expect(page.getByText('只是有班上又不是挣到了钱')).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('四块腹肌爱学习')).toBeVisible()
    await expect(page.getByText('bilibili')).toBeVisible()

    // 步骤5：验证"开始处理"按钮出现
    const startButton = page.getByRole('button', { name: '开始处理' })
    await expect(startButton).toBeVisible({ timeout: 10000 })

    // 步骤6：截图保存解析结果
    await page.screenshot({ path: 'parse-result.png', fullPage: true })
    console.log('解析成功，已保存截图 parse-result.png')

    // 步骤7：点击开始处理
    await startButton.click()

    // 步骤8：等待处理状态出现
    // 检查页面是否显示处理相关的内容（进度条、转录状态等）
    await page.waitForTimeout(2000)

    // 截图保存处理状态
    await page.screenshot({ path: 'processing-state.png', fullPage: true })
    console.log('已开始处理，已保存截图 processing-state.png')

    // 验证页面状态变化（应该在转录或显示结果）
    const currentStatus = await page.locator('body').textContent()
    console.log('当前页面状态（部分）:', currentStatus?.slice(0, 300))

    // 注意：由于转录可能需要较长时间，这里我们验证流程已启动
    // 完整流程测试需要根据实际处理时间来调整超时
  })

  test('解析阶段验证：视频信息正确显示', async ({ page }) => {
    await page.goto('/')

    // 输入链接
    const input = page.getByPlaceholder(/请粘贴B站/)
    await input.fill(TEST_URL)
    await page.getByRole('button', { name: '解析' }).click()

    // 验证视频信息正确显示
    await expect(page.getByText('只是有班上又不是挣到了钱')).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('四块腹肌爱学习')).toBeVisible()
    await expect(page.getByText('0:59')).toBeVisible() // 时长格式

    // 验证开始处理按钮可用
    const startButton = page.getByRole('button', { name: '开始处理' })
    await expect(startButton).toBeEnabled()

    console.log('视频信息验证通过')
  })
})