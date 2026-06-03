const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res))

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  global.io = io

  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      if (userId) socket.join(`user:${userId}`)
    })

    socket.on('leave', (userId) => {
      if (userId) socket.leave(`user:${userId}`)
    })

    socket.on('disconnect', () => {})
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
