export async function triggerVercelDeploy() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) return
  try {
    await fetch(hookUrl, { method: 'POST' })
  } catch (e) {
    console.warn('[deploy-hook] Failed to trigger Vercel deploy:', e)
  }
}
