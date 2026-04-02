const { chromium } = require('playwright')

const TEST_URL = 'https://www.bilibili.com/video/BV1bzAszCERo'

async function fullTest() {
  console.log('启动浏览器...')
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  // 监听网络请求
  page.on('response', response => {
    if (response.url().includes('/api/files/') && response.url().includes('frames')) {
      console.log('帧图片响应:', response.status(), response.url())
    }
  })

  try {
    await page.goto('http://localhost:3000')

    // 输入并解析链接
    const input = page.getByPlaceholder(/请粘贴B站/)
    await input.fill(TEST_URL)
    await page.getByRole('button', { name: '解析' }).click()

    // 等待视频信息
    await page.getByText('只是有班上又不是挣到了钱').waitFor({ timeout: 60000 })
    console.log('✓ 视频解析成功')

    // 点击开始处理
    await page.getByRole('button', { name: '开始处理' }).click()
    console.log('✓ 开始处理')

    // 等待结果页面
    await page.waitForURL('**/result**', { timeout: 600000 })
    console.log('✓ 转录完成，导航到结果页')

    // 检查逐字稿
    await page.getByRole('heading', { name: '逐字稿' }).waitFor({ timeout: 10000 })
    console.log('✓ 逐字稿显示正常')

    // 切换到图文标签
    await page.getByRole('tab', { name: '图文' }).click()
    console.log('✓ 切换到图文标签')

    // 点击生成文章
    const generateBtn = page.getByRole('button', { name: '生成文章' })
    if (await generateBtn.isVisible()) {
      await generateBtn.click()
      console.log('点击生成文章...')

      // 等待文章生成
      await page.waitForSelector('text=/字数：|生成时间：/', { timeout: 120000 })
      console.log('✓ 文章生成完成')
    }

    // 等待一小段时间让图片加载
    await page.waitForTimeout(3000)

    // 检查帧图片
    console.log('\n--- 检查帧图片 ---')
    const frameImages = page.locator('img[src*="/api/files/"]')
    const count = await frameImages.count()
    console.log(`找到 ${count} 个帧图片`)

    if (count > 0) {
      const firstSrc = await frameImages.first().getAttribute('src')
      console.log('第一个图片 src:', firstSrc)
    }

    // 截图
    await page.screenshot({ path: 'final-result.png', fullPage: true })
    console.log('\n截图已保存: final-result.png')

  } catch (error) {
    console.error('测试失败:', error)
    await page.screenshot({ path: 'error-result.png', fullPage: true })
    throw error
  } finally {
    await browser.close()
  }
}

fullTest().catch(console.error)