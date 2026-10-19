import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('Sprint 1: create, time, complete, check in, and restore after refresh', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: '规划你的第一条学习路线' })).toBeVisible()
  await page.getByRole('button', { name: /生成我的 7 天计划/ }).click()
  await expect(page.getByRole('dialog', { name: '规划你的第一条学习路线' })).toBeHidden()

  await page.getByRole('button', { name: '添加任务' }).click()
  await page.getByLabel('任务名称').fill('E2E 可恢复任务')
  await page.getByLabel('任务说明').fill('验证刷新后任务、完成状态与打卡仍存在')
  await page.getByLabel('分钟').fill('10')
  await page.getByRole('button', { name: '保存任务' }).click()

  const task = page.locator('article').filter({ hasText: 'E2E 可恢复任务' })
  await expect(task).toBeVisible()
  await task.getByRole('button', { name: /开始|自由计时/ }).click()
  await expect(page.getByRole('button', { name: '结束计时' })).toBeVisible()
  await page.getByRole('button', { name: '结束计时' }).click()
  await page.getByRole('button', { name: '记录并完成' }).click()

  await page.getByRole('button', { name: '提交今日打卡' }).click()
  await expect(page.getByText('今天已完成习惯打卡')).toBeVisible()

  await page.reload()
  await expect(page.getByText('E2E 可恢复任务')).toBeVisible()
  await expect(page.getByText('今天已完成习惯打卡')).toBeVisible()
  await expect(task.getByRole('button', { name: '标为未完成' })).toBeVisible()
})

test('display size can be changed and restored after refresh', async ({ page }) => {
  await page.getByRole('button', { name: /生成我的 7 天计划/ }).click()
  await page.goto('/#/settings')

  const largeSize = page.getByRole('button', { name: /大号/ })
  await largeSize.click()
  await expect(largeSize).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-font-scale', 'large')

  await page.reload()
  await expect(page.getByRole('button', { name: /大号/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-font-scale', 'large')
})
