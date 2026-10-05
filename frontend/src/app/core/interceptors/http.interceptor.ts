import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';

/**
 * Routes qui ne doivent jamais déclencher le loader global, car elles sont
 * déclenchées pendant le rendu d'une conversation ou d'une liste d'amis :
 * un loader plein écran ferait clignoter l'interface.
 */
const SILENT_URL_FRAGMENTS = ['/auth/sendMessage/', '/auth/getAmis', '/auth/getAllmsgs'];

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(
    private readonly router: Router,
    private readonly loading: LoadingService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const cloned = request.clone({ withCredentials: true });

    if (this.isSilent(request.url)) {
      return next.handle(cloned);
    }

    this.loading.show();

    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        this.redirectOnError(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.hide()),
    );
  }

  private isSilent(url: string): boolean {
    return SILENT_URL_FRAGMENTS.some((fragment) => url.includes(fragment));
  }

  private redirectOnError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        this.router.navigate(['/login']);
        break;
      case 403:
      case 404:
      case 500:
        this.router.navigate(['/error', error.status]);
        break;
      default:
        break;
    }
  }
}