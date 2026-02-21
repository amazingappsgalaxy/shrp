#!/usr/bin/env node
/*
  Dev launcher that auto-selects a free port (prefers PORT or 3003) so `npm run dev` never fails with EADDRINUSE.
*/

const net = require('net')
const { spawn } = require('child_process')

async function isPortFree(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', () => resolve(false))
    srv.listen({ port, host }, () => {
      srv.close(() => resolve(true))
    })
  })
}

async function findFreePort(start, maxAttempts = 50) {
  let port = start
  for (let i = 0; i < maxAttempts; i++) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port)
    if (free) return port
    port += 1
  }
  // Fallback: let OS assign an ephemeral port
  return 0
}

async function main() {
  const preferred = Number(process.env.PORT || process.env.PREFERRED_PORT || 3003)
  const port = await findFreePort(preferred)

  if (port === 0) {
    console.warn(`Preferred port ${preferred} is busy and no nearby free port found. Falling back to an ephemeral port.`)
  } else if (port !== preferred) {
    console.warn(`Port ${preferred} is busy. Using free port ${port} instead.`)
  }

  const args = ['dev', '-p', String(port)]
  const cmd = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next'

  console.log(`Starting Next.js dev server on port ${port || '(ephemeral)'}`)
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
    shell: false,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`Dev server exited due to signal ${signal}`)
      process.exit(1)
    } else {
      process.exit(code || 0)
    }
  })
}

main().catch((err) => {
  console.error('Failed to start dev server:', err)
  process.exit(1)
})