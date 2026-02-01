import { AuthenticationService } from './authentication.service';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  isAuthenticated: boolean;
  intendedUrl: string;

  constructor(private _router: Router, private _authService: AuthenticationService) {
    this._authService.intendedUrlObservable.subscribe((url) => this.intendedUrl = url);
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkUserLogin(next, state.url);
  }

  
  checkUserLogin(route: ActivatedRouteSnapshot, url: any): Promise<boolean> {
    // console.log("auth.guard is executed.");
    // if (this._authService.isLoggedIn()) {
    //   const userRole = this._authService.currentUserValue().role;
    //   console.log(`route.data.role is ${route.data.role}`);
    //   console.log(`userRole is ${userRole}`);
    //   if (route.data.role && route.data.role.indexOf(userRole) === -1) {
    //   console.log("Access denied due to role restriction!");
    //   return false;
    //   }
    //   return true;
    // } else {
    //   this._router.navigateByUrl('/login');
    //   return false;
    return this._authService
      .authenticateWithJwtTokenPromise()
      .then((value) => {
        this.isAuthenticated = this._authService.isLoggedIn();
        // console.log("isAuthenticated in auth.guard is: " + this.isAuthenticated);
      })
      .then((value) => {
        if (this.isAuthenticated) {
          if(url=="/user-profile" && !this._authService.passwordVerified ){
            this._router.navigateByUrl('/modeling');
            return false;
          }
          const userRole = this._authService.currentUserValue().role;
          // console.log(`userRole is ${userRole}`);
          if (route.data.role && route.data.role.indexOf(userRole) === -1) {
            console.log("Access denied due to role restriction!");
            return false
          }
          return true
        } else {
          this._router.navigateByUrl('/login');
          return false
        }
      });
  }
  
}
