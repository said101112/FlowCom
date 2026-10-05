import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpInterceptorService } from './core/interceptors/http.interceptor';

import { BorderAnimComponent } from './components/border-anim/border-anim.component';
import { ChatComponent } from './components/chat/chat.component';
import { ListConversationComponent } from './components/chat/list-conversation/list-conversation.component';
import { SidebarComponent } from './components/chat/sidebar/sidebar.component';
import { ErrorComponent } from './components/error/error.component';
import { LoginComponent } from './components/login/login.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { ToastComponent } from './shared/toast/toast.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ChatComponent,
    SidebarComponent,
    ListConversationComponent,
    ErrorComponent,
    LoaderComponent,
    BorderAnimComponent,
    ToastComponent,
  ],
  imports: [
    HttpClientModule,
    CommonModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}