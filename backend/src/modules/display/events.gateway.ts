import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized for Live Display Sync.');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Live Display WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Live Display WebSocket: ${client.id}`);
  }

  /**
   * Broadcast instant sync signal to all active display screens
   */
  emitDisplayUpdate(event = 'display:sync', payload: any = { timestamp: Date.now() }) {
    try {
      if (this.server) {
        this.server.emit(event, payload);
      }
    } catch (err) {
      this.logger.warn('Failed to emit WebSocket display sync:', err);
    }
  }
}
