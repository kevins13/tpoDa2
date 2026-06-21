import { io, Socket } from 'socket.io-client';

// Use the local network IP or an environment variable
// TODO: Replace with the actual backend IP if running on a real device
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.48:4000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAuction(auctionId: string) {
    if (this.socket) {
      this.socket.emit('join_auction', auctionId);
    }
  }

  leaveAuction(auctionId: string) {
    if (this.socket) {
      this.socket.emit('leave_auction', auctionId);
    }
  }

  onNewBid(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new_bid', callback);
    }
  }

  offNewBid(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('new_bid', callback);
    }
  }
}

export const socketService = new SocketService();
