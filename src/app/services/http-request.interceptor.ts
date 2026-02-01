import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  constructor(private _spinner: NgxSpinnerService, private _snackBar: MatSnackBar) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const idToken = localStorage.getItem("id_token");

    if (idToken) {
      const clonedRequest = request.clone({
        headers:request.headers.set("Authorization", idToken),
        withCredentials: true
      });

      // return next.handle(clonedRequest);
      return next.handle(clonedRequest).pipe(
        tap((success: any) => {
          // IF ANY SUCCESS REQUEST
        }, (error: any) => {
          this._spinner.hide();
          // SHOW RESPONSE BASED ON ERRORS
          if (error.status == 500) {
            let message = error.error ? error.error : "Server error.";
            this._snackBar.open(message, "Failed", { duration: 10000 });
          } else if (error.status == 401) {
            let message = error.error.message ? error.error.message : "Please log in.";
            this._snackBar.open(message, "", { duration: 5000 });
          } else if (error.status == 403) {
            let message = error.error ? error.error : "You are not authorized.";
            this._snackBar.open(message, "", { duration: 5000 });
          } else {
            let message = error.error ? error.error : "Something went wrong.";
            this._snackBar.open(message, "", { duration: 5000 });
          }
        }));
    } else { // request doesn't need token
      return next.handle(request).pipe(
        tap((success: any) => {
          // IF ANY SUCCESS REQUEST
        }, (error: any) => {
          this._spinner.hide();
          // SHOW RESPONSE BASED ON ERRORS
          if (error.status == 500) {
            let message = error.error ? error.error : "Server error.";
            this._snackBar.open(message, "Failed", { duration: 10000 });
          } else if (error.status == 401) {
            let message = error.error.message ? error.error.message : "Incorrect user ID or password.";
            this._snackBar.open(message, "", { duration: 5000 });
          } else if (error.status == 403) {
            let message = error.error ? error.error : "You are not authorized.";
            this._snackBar.open(message, "", { duration: 5000 });
          } else {
            let message = error.error ? error.error : "Something went wrong.";
            this._snackBar.open(message, "", { duration: 5000 });
          }
        }));
    }
  };



}
