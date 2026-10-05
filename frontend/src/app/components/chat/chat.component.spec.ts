import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      // Le template référence les sous-composants déclarés dans AppModule.
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('génère un identifiant de room au bon format', () => {
    expect(component.generateRoomId()).toMatch(/^room_\d+_\d{1,4}$/);
  });

  it('n envoie pas un message vide', () => {
    const sendSpy = spyOn(component['api'], 'sendMessage');

    component.inputMessage = '   ';
    component.sendMessage();

    expect(sendSpy).not.toHaveBeenCalled();
  });
});
