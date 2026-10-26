import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/kds',
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KdsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado a KDS Gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado de KDS Gateway: ${client.id}`);
  }

  @SubscribeMessage('join_kds')
  handleJoinKds(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; stationId: string },
  ) {
    if (!data?.tenantId || !data?.stationId) {
      return { success: false, error: 'tenantId y stationId son requeridos' };
    }
    const room = `room:tenant_${data.tenantId}:kds_${data.stationId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} suscrito a sala KDS: ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('join_cashier')
  handleJoinCashier(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    if (!data?.tenantId) {
      return { success: false, error: 'tenantId es requerido' };
    }
    const room = `room:tenant_${data.tenantId}:cashier`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} suscrito a sala Caja: ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('join_waiters')
  handleJoinWaiters(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    if (!data?.tenantId) {
      return { success: false, error: 'tenantId es requerido' };
    }
    const room = `room:tenant_${data.tenantId}:waiters`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} suscrito a sala Meseras/Comandero: ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('kds:mark_order_ready')
  handleMarkOrderReady(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      tenantId: string;
      orderId: string;
      stationId?: string;
      stationName?: string;
      tableNumber?: string;
    },
  ) {
    if (!data?.tenantId || !data?.orderId) {
      return { success: false, error: 'tenantId y orderId son requeridos' };
    }
    const payload = {
      orderId: data.orderId,
      stationId: data.stationId,
      stationName: data.stationName || 'Cocina',
      tableNumber: data.tableNumber || 'Salón',
      status: 'READY',
      readyAt: new Date(),
    };
    this.notifyWaiters(data.tenantId, 'order:status_updated', payload);
    this.notifyCashier(data.tenantId, 'order:status_updated', payload);
    return { success: true, ...payload };
  }

  notifyKdsStation(tenantId: string, stationId: string, event: string, payload: any) {
    const room = `room:tenant_${tenantId}:kds_${stationId}`;
    this.server?.to(room).emit(event, payload);
    this.logger.log(`[WebSocket] Evento '${event}' emitido a sala KDS: ${room}`);
  }

  notifyCashier(tenantId: string, event: string, payload: any) {
    const room = `room:tenant_${tenantId}:cashier`;
    this.server?.to(room).emit(event, payload);
    this.logger.log(`[WebSocket] Evento '${event}' emitido a sala Caja: ${room}`);
  }

  notifyWaiters(tenantId: string, event: string, payload: any) {
    const room = `room:tenant_${tenantId}:waiters`;
    this.server?.to(room).emit(event, payload);
    this.logger.log(`[WebSocket] Evento '${event}' emitido a sala Meseras: ${room}`);
  }
}
