import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface MessagePayload {
  text: string;
}

export interface AuthResponse {
  message?: string;
  id?: string;
  role?: string;
  token?: string;
  success?: boolean;
  error?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receverId: string;
  text: string;
  status: 'sent' | 'delivered' | 'seen';
  createdAt: string;
}

export interface MessagesResponse {
  message: string;
  messages: Message[];
}

export interface Friend {
  _id: string;
  username: string;
  email: string;
  phone: string;
  lastSeen?: string;
  avatar?: string;
  status?: string;
}

export interface FriendsResponse {
  amis: Friend[];
  unseenMessage: Record<string, number>;
  LastMessages: Record<string, Message>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // --- Auth ---
  signup(payload: SignupPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, payload, {
      withCredentials: true,
    });
  }

  signin(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signin`, payload, {
      withCredentials: true,
    });
  }

  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/logout`, {}, {
      withCredentials: true,
    });
  }

  updateLastLogin(userId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/updateLastLogin`,
      { userId },
      { withCredentials: true },
    );
  }

  // --- Amis ---
addFriend(input: string, currentUserId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/addAmis`,
      { input, currentUserId },
      { withCredentials: true },
    );
  }

  getFriends(userId: string): Observable<FriendsResponse> {
    return this.http.get<FriendsResponse>(`${this.baseUrl}/getAmis/${userId}`, {
      withCredentials: true,
    });
  }

  // --- Messages ---
  sendMessage(receiverId: string, payload: MessagePayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/sendMessage/${receiverId}`,
      payload,
      { withCredentials: true },
    );
  }

  getMessages(selectedUserId: string): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(
      `${this.baseUrl}/getAllmsgs/${selectedUserId}`,
      { withCredentials: true },
    );
  }

  // --- Utilisateurs ---
  getUserProfile(userId: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/user/${userId}`, {
      withCredentials: true,
    });
  }
}