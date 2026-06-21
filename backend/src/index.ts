import app from './app';
import http from 'http';
import { Server } from 'socket.io';
import { iniciarPollingValidacion } from './utilidades/pollingValidacion';

const port = process.env.PORT ?? 4000;

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_auction', (auctionId: string) => {
    socket.join(`auction_${auctionId}`);
    console.log(`Socket ${socket.id} joined room: auction_${auctionId}`);
  });

  socket.on('leave_auction', (auctionId: string) => {
    socket.leave(`auction_${auctionId}`);
    console.log(`Socket ${socket.id} left room: auction_${auctionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(port as number, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
  iniciarPollingValidacion();
});
