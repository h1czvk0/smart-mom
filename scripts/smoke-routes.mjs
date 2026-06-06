const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5173'

const routes = [
  '/dashboard',
  '/tasks',
  '/tasks?keyword=异常',
  '/tasks/WO-20260606-001',
  '/devices',
  '/reports',
  '/missing-route',
]

const results = []

for (const route of routes) {
  const url = new URL(route, baseUrl)
  const response = await fetch(url)
  const html = await response.text()
  const passed = response.ok && html.includes('<div id="app">')

  results.push({
    route,
    status: response.status,
    passed,
  })
}

for (const result of results) {
  const mark = result.passed ? 'PASS' : 'FAIL'
  console.log(`${mark} ${result.status} ${result.route}`)
}

if (results.some((result) => !result.passed)) {
  process.exitCode = 1
}
