import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;

  constructor() {}

  // Connexion avec l'ID utilisateur
  connect(userId: string) {
    console.log('🔌 Tentative de connexion au socket avec userId:', userId);
  if (!this.socket) {
      
    this.socket = io('http://localhost:3000', {
       withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur Socket.IO avec ID:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion au socket:', err);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Déconnecté du socket. Raison:', reason);
    });
  }
  }

  // Écouter les nouveaux messages
onNewMessage(callback: (data: { msg: any, senderUsername: string }) => void) {
  this.socket.on('newMessage', (msg: any, senderUsername: string) => {
    console.log('📨 Nouveau message reçu:', msg);
    console.log('👤 Envoyé par:', senderUsername);

    callback({ msg, senderUsername });
  });
}


  // Écouter les utilisateurs en ligne
  onOnlineUsers(callback: (userIds: string[]) => void) {
    this.socket.on('getOnlineUsers', (userIds) => {
      console.log('🟢 Utilisateurs en ligne reçus:', userIds);
      callback(userIds);
    });
  }
  joinRoom(room:any){
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      return;
    }
    this.socket.emit('joinRoom',room);
  }
  // Envoyer un message
  sendMessage(Room : any, message: any) {
    console.log('📤 Envoi du message:', message);
    this.socket.emit('sendMessage', {Room,message});
  }
 onAiSegg(callback?: (s: string[]) => void) {
  this.socket.on('ai_segg', (data) => {
    console.log('Suggestions reçues:', data.s);
    if (callback) callback(data.s);
  });
}

  Addf(Id:any,Code:any){
    console.log('amis a ajouter avec code ',Code);
    this.socket.emit('AddFriend',{id:Id,CodeConnectF:Code});
  }
  onFriendAdded(callback:any){
  this.socket.on('friendAdded', callback);
}

  // Déconnexion
  disconnect() {
    if (this.socket) {
      console.log('🔌 Déconnexion du socket avec ID:', this.socket.id);
      this.socket.disconnect();
    }
  }
}
