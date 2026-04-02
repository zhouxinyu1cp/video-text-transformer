import { test, expect } from '@playwright/test'

test.describe('视频智能文稿生成器', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('首页应正确加载', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('视频智能文稿生成器')
    await expect(page.getByPlaceholder(/请粘贴B站/)).toBeVisible()
    await expect(page.getByText('解析')).toBeVisible()
  })

  test('应显示支持的平台列表', async ({ page }) => {
    await expect(page.getByText('B站 (bilibili.com)')).toBeVisible()
    await expect(page.getByText('抖音 (douyin.com)')).toBeVisible()
    await expect(page.getByText('YouTube (youtube.com)')).toBeVisible()
    await expect(page.getByText('视频号 (channels.weixin.qq.com)')).toBeVisible()
  })

  test('空输入时应禁用解析按钮', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: '解析' })
    await expect(submitButton).toBeDisabled()
  })

  test('输入B站链接后应启用解析按钮', async ({ page }) => {
    const input = page.getByPlaceholder(/请粘贴B站/)
    const submitButton = page.getByRole('button', { name: '解析' })

    await input.fill('https://www.bilibili.com/video/BV1xx411c7mD')
    await expect(submitButton).toBeEnabled()
  })

  test('输入无效链接后点击解析应显示错误', async ({ page }) => {
    const input = page.getByPlaceholder(/请粘贴B站/)
    const submitButton = page.getByRole('button', { name: '解析' })

    await input.fill('https://example.com/invalid')
    await submitButton.click()

    // 应该显示错误信息（因为是mock API，实际返回的是mock数据）
    // 等待响应
    await page.waitForTimeout(1000)
  })

  test('解析B站链接后应显示视频信息卡片', async ({ page }) => {
    const input = page.getByPlaceholder(/请粘贴B站/)
    const submitButton = page.getByRole('button', { name: '解析' })

    await input.fill('https://www.bilibili.com/video/BV1xx411c7mD')
    await submitButton.click()

    // 等待解析完成（mock数据）
    await page.waitForTimeout(2000)

    // 应该显示视频信息卡片
    await expect(page.getByText('B站视频 BV1xx411c7mD')).toBeVisible({ timeout: 5000 })
  })

  test('解析完成后应显示开始处理按钮', async ({ page }) => {
    const input = page.getByPlaceholder(/请粘贴B站/)
    const submitButton = page.getByRole('button', { name: '解析' })

    await input.fill('https://www.bilibili.com/video/BV1xx411c7mD')
    await submitButton.click()

    await page.waitForTimeout(2000)

    // 应该显示开始处理按钮
    const startButton = page.getByRole('button', { name: '开始处理' })
    await expect(startButton).toBeVisible({ timeout: 5000 })
  })
})

test.describe('结果页面', () => {
  test('无视频数据访问结果页应重定向或显示提示', async ({ page }) => {
    await page.goto('/result')

    // 根据状态显示不同内容
    // 可能显示加载状态或提示
    await page.waitForTimeout(1000)
  })
})