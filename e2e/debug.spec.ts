import { test, expect } from '@playwright/test'

test('调试：查看页面加载后的状态', async ({ page }) => {
  await page.goto('/')

  // 截图保存页面状态
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true })

  // 打印页面标题
  console.log('页面标题:', await page.title())

  // 打印页面 URL
  console.log('页面 URL:', page.url())

  // 查找所有按钮
  const buttons = await page.getByRole('button').all()
  console.log('按钮数量:', buttons.length)
  for (const btn of buttons) {
    console.log('按钮:', await btn.textContent())
  }

  // 输入链接
  const input = page.getByPlaceholder(/请粘贴B站/)
  await input.fill('https://www.bilibili.com/video/BV1bzAszCERo')

  // 截图保存输入后状态
  await page.screenshot({ path: 'debug-after-input.png', fullPage: true })

  // 点击解析按钮
  await page.getByRole('button', { name: '解析' }).click()

  // 等待5秒
  await page.waitForTimeout(5000)

  // 截图保存点击后状态
  await page.screenshot({ path: 'debug-after-click.png', fullPage: true })

  // 打印页面内容（body 的文本）
  const bodyText = await page.locator('body').textContent()
  console.log('页面内容 (前500字符):', bodyText?.slice(0, 500))

  // 检查是否有错误信息
  const errorElements = await page.locator('[class*="error"], [class*="red"]').all()
  if (errorElements.length > 0) {
    console.log('错误元素数量:', errorElements.length)
    for (const err of errorElements) {
      console.log('错误:', await err.textContent())
    }
  }

  // 验证基本元素可见
  await expect(page.locator('h1')).toContainText('视频智能文稿生成器')
})