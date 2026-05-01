import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;

  connect(onRequestCreated: () => void, onRequestUpdated: () => void, onRequestDeleted: () => void): void {
    if (this.socket?.connected) {
      return;
    };

    if (this.socket) {
      this.socket.connect();
    };

    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
    });

    this.socket.on('request:created', onRequestCreated);
    this.socket.on('request:updated', onRequestUpdated);
    this.socket.on('request:deleted', onRequestDeleted);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket?.off('request:created');
    this.socket?.off('request:updated');
    this.socket?.off('request:deleted');
  }
}