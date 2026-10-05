import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('poste signup avec withCredentials', () => {
    service.signup({
      username: 'alice',
      email: 'alice@example.com',
      password: 'motdepasse',
      phone: '0600000000',
      firstName: 'Alice',
      lastName: 'Martin',
    }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/signup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ success: true });
  });

  it('appelle la bonne URL pour l inscription et la connexion', () => {
    service.signin({ email: 'alice@example.com', password: 'motdepasse' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/signin`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'u1', role: 'user' });
  });

  it('interroge l historique de messages', () => {
    service.getMessages('u2').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/getAllmsgs/u2`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'get all msg', messages: [] });
  });

  it('déconnecte sans envoyer de corps', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ message: 'Déconnexion réussie' });
  });
});
