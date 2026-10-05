import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('bascule entre connexion et inscription', () => {
    expect(component.isLogin).toBeTrue();

    component.toggleForm();

    expect(component.isLogin).toBeFalse();
  });

  it('réinitialise le formulaire', () => {
    component.formData = {
      firstName: 'Alice',
      lastName: 'Martin',
      username: 'alice',
      email: 'alice@example.com',
      phone: '0600000000',
      password: 'motdepasse',
    };

    component.resetForm();

    expect(component.formData.email).toBe('');
    expect(component.formData.password).toBe('');
  });
});
