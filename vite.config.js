import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

function deepSeekProxy(env) {
  return {
    name: 'deepseek-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/deepseek/chat/completions', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const apiKey = process.env.DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY

        if (!apiKey) {
          res.statusCode = 501
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'DEEPSEEK_API_KEY is not configured in the dev server environment.' }))
          return
        }

        try {
          const body = await readRequestBody(req)
          const baseUrl = (process.env.DEEPSEEK_BASE_URL || env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
          const upstream = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body,
          })

          res.statusCode = upstream.status
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')

          if (!upstream.body) {
            res.end(await upstream.text())
            return
          }

          for await (const chunk of upstream.body) {
            res.write(Buffer.from(chunk))
          }

          res.end()
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message || 'DeepSeek proxy request failed.' }))
        }
      })
    },
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), deepSeekProxy(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
