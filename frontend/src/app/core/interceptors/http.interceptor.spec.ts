import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HttpInterceptorService } from './http.interceptor';
import { LoadingService } from '../services/loading.service';

describe('HttpInterceptorService', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideRouter([]),
        LoadingService,
        { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => httpMock.verify());

  it('ajoute withCredentials à chaque requête', () => {
    http.get('/auth/user/1').subscribe();

    const req = httpMock.expectOne('/auth/user/1');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
  });

  it("n'affiche pas le loader sur les routes silencieuses", () => {
    const showSpy = spyOn(loading, 'show');

    http.get('/auth/getAmis/1').subscribe();

    httpMock.expectOne('/auth/getAmis/1').flush({});
    expect(showSpy).not.toHaveBeenCalled();
  });

  it('affiche puis masque le loader sur une route normale', () => {
    const showSpy = spyOn(loading, 'show');
    const hideSpy = spyOn(loading, 'hide');

    http.post('/auth/signin', {}).subscribe();

    expect(showSpy).toHaveBeenCalled();
    httpMock.expectOne('/auth/signin').flush({});
    expect(hideSpy).toHaveBeenCalled();
  });
});