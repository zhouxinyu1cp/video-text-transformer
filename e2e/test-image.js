const { chromium } = require('playwright')

async function testImage() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    // 直接访问图片 URL
    const imageUrl = 'http://localhost:3001/api/files/session_1775105130849_r501xk37q/frames/frame_001.jpg'

    await page.goto(imageUrl)
    console.log('页面标题:', await page.title())
    console.log('页面内容长度:', (await page.content()).length)

    // 检查是否是图片
    const img = await page.locator('img')
    if (await img.count() > 0) {
      console.log('找到图片元素')
    } else {
      // 可能直接返回了图片数据
      const body = await page.content()
      console.log('body 前 100 字符:', body.slice(0, 100))
    }

    // 尝试用 img 标签加载
    await page.goto('about:blank')
    await page.setContent(`
      <html>
        <body>
          <img src="${imageUrl}" onload="console.log('Image loaded successfully')" onerror="console.log('Image failed to load')" />
        </body>
      </html>
    `)

    await page.waitForTimeout(2000)
    console.log('图片加载测试完成')

    // 截图看结果
    await page.screenshot({ path: 'image-test.png' })
    console.log('截图已保存: image-test.png')

  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    await browser.close()
  }
}

testImage().catch(console.error)