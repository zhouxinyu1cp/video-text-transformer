const { chromium } = require('playwright')

async function checkFrames() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    // 访问结果页面
    await page.goto('http://localhost:3000/result')

    // 切换到图文标签
    await page.getByRole('tab', { name: '图文' }).click()
    await page.waitForTimeout(1000)

    // 找到所有帧图片
    const frameImages = page.locator('img[src*="/api/files/"]')
    const count = await frameImages.count()
    console.log(`找到 ${count} 个帧图片`)

    if (count > 0) {
      // 获取第一个图片的属性
      const firstImg = frameImages.first()
      const src = await firstImg.getAttribute('src')
      const naturalWidth = await firstImg.evaluate(img => img.naturalWidth)
      const naturalHeight = await firstImg.evaluate(img => img.naturalHeight)
      const complete = await firstImg.evaluate(img => img.complete)

      console.log('第一个图片属性:')
      console.log('  src:', src)
      console.log('  naturalWidth:', naturalWidth)
      console.log('  naturalHeight:', naturalHeight)
      console.log('  complete:', complete)

      // 截图标记图片位置
      await page.screenshot({ path: 'frames-check.png', fullPage: true })
      console.log('截图已保存: frames-check.png')
    } else {
      console.log('没有找到帧图片，检查关键帧区域是否存在')
      const framesSection = page.locator('text=关键帧')
      if (await framesSection.isVisible()) {
        console.log('关键帧区域存在但没有图片')
        // 获取关键帧区域的 HTML
        const html = await page.locator('.prose').innerHTML()
        console.log('prose 内容片段:', html.slice(0, 500))
      }
    }

  } catch (error) {
    console.error('检查失败:', error)
    await page.screenshot({ path: 'frames-error.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

checkFrames().catch(console.error)