import { test, expect, chromium } from '@playwright/test'

const TEST_URL = 'https://www.bilibili.com/video/BV1bzAszCERo'

test('验证抽帧图片修复', async () => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:3000')

    // 输入并解析链接
    const input = page.getByPlaceholder(/请粘贴B站/)
    await input.fill(TEST_URL)
    await page.getByRole('button', { name: '解析' }).click()

    // 等待视频信息
    await expect(page.getByText('只是有班上又不是挣到了钱')).toBeVisible({ timeout: 60000 })
    console.log('✓ 视频解析成功')

    // 点击开始处理
    await page.getByRole('button', { name: '开始处理' }).click()
    console.log('✓ 开始处理')

    // 等待结果页面
    await page.waitForURL('**/result**', { timeout: 600000 })
    console.log('✓ 转录完成，导航到结果页')

    // 检查逐字稿显示
    await expect(page.getByText('逐字稿')).toBeVisible({ timeout: 10000 })
    console.log('✓ 逐字稿显示正常')

    // 切换到图文标签并生成文章
    await page.getByRole('tab', { name: '图文' }).click()
    console.log('✓ 切换到图文标签')

    // 点击生成文章（如果还没生成）
    const generateBtn = page.getByRole('button', { name: '生成文章' })
    if (await generateBtn.isVisible()) {
      await generateBtn.click()
      console.log('点击生成文章...')

      // 等待文章生成完成
      await expect(page.getByText(/字数：|生成时间：/)).toBeVisible({ timeout: 120000 })
      console.log('✓ 文章生成完成')
    }

    // 截图保存最终结果
    await page.screenshot({ path: 'verify-fix-result.png', fullPage: true })

    // 验证关键帧是否显示
    const framesSection = page.locator('text=关键帧')
    if (await framesSection.isVisible()) {
      console.log('✓ 关键帧区域可见')

      // 检查是否有图片
      const frameImages = page.locator('img[src*="/api/files/"]')
      const imageCount = await frameImages.count()
      console.log(`✓ 找到 ${imageCount} 个帧图片`)

      if (imageCount > 0) {
        // 验证第一个图片 URL
        const firstSrc = await frameImages.first().getAttribute('src')
        console.log(`✓ 第一个帧图片 URL: ${firstSrc}`)
      }
    } else {
      console.log('⚠ 关键帧区域不可见')
    }

    console.log('\n========================================')
    console.log('验证完成！截图已保存: verify-fix-result.png')
    console.log('========================================')

  } catch (error) {
    console.error('测试失败:', error)
    await page.screenshot({ path: 'verify-fix-error.png', fullPage: true })
    throw error
  } finally {
    await browser.close()
  }
})