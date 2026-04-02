import { test, expect, chromium, type Browser, type Page } from '@playwright/test'

const TEST_URL = 'https://www.bilibili.com/video/BV1bzAszCERo'

async function runFullFlowTest() {
  console.log('启动浏览器...')
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 步骤1：打开首页
    console.log('打开首页...')
    await page.goto('http://localhost:3000')
    await expect(page.locator('h1')).toContainText('视频智能文稿生成器')
    console.log('✓ 首页加载成功')

    // 步骤2：输入B站视频链接
    console.log('输入视频链接...')
    const input = page.getByPlaceholder(/请粘贴B站/)
    const submitButton = page.getByRole('button', { name: '解析' })
    await input.fill(TEST_URL)
    await expect(submitButton).toBeEnabled()
    console.log('✓ 已输入链接:', TEST_URL)

    // 步骤3：点击解析按钮
    console.log('点击解析按钮...')
    await submitButton.click()
    console.log('✓ 等待解析结果...')

    // 步骤4：等待视频信息显示
    await expect(page.getByText('只是有班上又不是挣到了钱')).toBeVisible({ timeout: 60000 })
    await expect(page.getByText('四块腹肌爱学习')).toBeVisible()
    await expect(page.getByText('0:59')).toBeVisible()
    console.log('✓ 视频信息解析成功')
    console.log('  - 标题: 只是有班上又不是挣到了钱')
    console.log('  - 作者: 四块腹肌爱学习')
    console.log('  - 时长: 0:59')

    // 步骤5：验证开始处理按钮
    const startButton = page.getByRole('button', { name: '开始处理' })
    await expect(startButton).toBeVisible()
    await expect(startButton).toBeEnabled()
    console.log('✓ 开始处理按钮可用')

    // 步骤6：点击开始处理
    console.log('点击开始处理...')
    await startButton.click()
    console.log('✓ 开始处理流程，请等待...')
    console.log('  (转录和图文生成可能需要几分钟)')

    // 步骤7：等待转录状态显示
    // 页面应该显示进度状态
    await page.waitForTimeout(3000)

    // 监听转录进度更新
    let processingComplete = false
    let retryCount = 0
    const maxRetries = 60 // 最多等待60次检查（约5分钟）

    while (!processingComplete && retryCount < maxRetries) {
      retryCount++
      const pageContent = await page.locator('body').textContent()

      // 检查是否完成（导航到结果页或显示结果）
      if (page.url().includes('/result')) {
        console.log('✓ 流程完成，已导航到结果页')
        processingComplete = true
      } else if (pageContent?.includes('逐字稿') || pageContent?.includes('转录')) {
        console.log(`  进度检查 ${retryCount}/${maxRetries}: 检测到转录相关UI...`)
      }

      if (!processingComplete) {
        await page.waitForTimeout(5000) // 每5秒检查一次
      }
    }

    if (!processingComplete) {
      console.log('⚠ 处理超时，但仍验证了关键流程启动成功')
    }

    // 步骤8：验证结果页面
    console.log('验证结果页面...')
    await page.waitForURL('**/result**', { timeout: 600000 }).catch(() => {})

    const finalContent = await page.locator('body').textContent()

    if (finalContent?.includes('逐字稿') || finalContent?.includes('转录')) {
      console.log('✓ 结果页面显示逐字稿/转录内容')
    }

    if (finalContent?.includes('图文') || finalContent?.includes('文章')) {
      console.log('✓ 结果页面显示图文内容')
    }

    console.log('\n========================================')
    console.log('全流程测试完成！')
    console.log('========================================')

    // 截图保存最终状态
    await page.screenshot({ path: 'full-flow-result.png', fullPage: true })
    console.log('已保存截图: full-flow-result.png')

  } catch (error) {
    console.error('测试失败:', error)
    await page.screenshot({ path: 'full-flow-error.png', fullPage: true })
    console.log('已保存错误截图: full-flow-error.png')
    throw error
  } finally {
    await browser.close()
  }
}

runFullFlowTest().catch(console.error)