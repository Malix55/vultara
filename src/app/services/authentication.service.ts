import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpRequest, HttpParams, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import * as moment from "moment";
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';


export enum Role {
  superAdmin = "Super Admin",
  admin = "Admin",
  securityManager = "Security Manager",
  securityEngineer = "Security Engineer",
  productEngineer = "Product Engineer",
  threatResearcher ="Threat Researcher",
  threatReviewer ="Threat Reviewer"
}

export class UserProfile {
  username?: string;
  userEmail?: string;
  role?: Role;
  isAuth: boolean;
  projectAccess?: string[];
  rememberMe?: boolean;
  _id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  posts: any;
  displayMsg: string = "";
  readonly serverRootUrl = environment.backendApiUrl + "user";
  public loginAttemptCounter: number = 0;
  public reloadRequire:boolean;
  passwordVerified:boolean = false;

  currentUserProfile: UserProfile = {
    isAuth: false,
  }

  intendedUrl = "";

  private _currentUserSubject: BehaviorSubject<UserProfile> = new BehaviorSubject(this.currentUserProfile);
  currentUserObservable: Observable<UserProfile> = this._currentUserSubject.asObservable();

  private _intendedUrlSubject: BehaviorSubject<string> = new BehaviorSubject(this.intendedUrl);
  intendedUrlObservable: Observable<string> = this._intendedUrlSubject.asObservable();

  // PUBLIC OBJECT FOR EMITTER
  public setCurrentUrlEmitter = new EventEmitter();

  constructor(private _http: HttpClient, private _router: Router, private _spinner: NgxSpinnerService) {
    // this._currentUserSubject = new BehaviorSubject(this.currentUserProfile);
    // this.currentUserObservable = this._currentUserSubject.asObservable();
   }

   /**
    * Emit an event for current url
    */
   emitCurrentUrlEvent() : any {
    this.setCurrentUrlEmitter.emit(null);
  }

  public currentUserValue(): UserProfile {
    return this._currentUserSubject.value;
  }

  updateIntendedUrl(url) {
    console.log(`before update, intendedUrlSubject is ${this._intendedUrlSubject.value}`);
    this._intendedUrlSubject.next(url);
    console.log(`after update, intendedUrlSubject is ${this._intendedUrlSubject.value}`);
  }

  loadBrowserStorage() {  // not used. token doesn't contain user profile information
    // for local strategy
    // if (localStorage.getItem("user")) {
    //   let user = JSON.parse(localStorage.getItem("user"));
    //   this._currentUserSubject.value.isAuth = true;
    //   this._currentUserSubject.value.username = user.username;
    //   this._currentUserSubject.value.role = user.role;
    //   this._currentUserSubject.value.rememberMe = user.rememberMe;
    // } else if (sessionStorage.getItem("user")) {
    //   let user = JSON.parse(sessionStorage.getItem("user"));
    //   this._currentUserSubject.value.isAuth = true;
    //   this._currentUserSubject.value.username = user.username;
    //   this._currentUserSubject.value.role = user.role;
    //   this._currentUserSubject.value.rememberMe = user.rememberMe;
    // }
    if (localStorage.getItem("id_token")) {
      let user = JSON.parse(localStorage.getItem("id_token"));
      this._currentUserSubject.value.username = user.username;
      this._currentUserSubject.value.role = user.role;
    }
  }
  login(loginCredential): string {
    const headers = new HttpHeaders({"Content-type": "application/json"});
    this.posts = this._http.post(this.serverRootUrl + "/login", loginCredential, {headers: headers});
    this.posts.subscribe((res) => {
      // console.log(`response is ${res.isAuth}`);
      if (res.isAuth) {
        // local strategy
        // this._currentUserSubject.value.isAuth = true;
        // this._currentUserSubject.value.username = res.username;
        // this._currentUserSubject.value.role = res.role;

        // jwt strategy
        this._currentUserSubject.value.isAuth = res.isAuth;
        this._currentUserSubject.value.username = res.username;
        this._currentUserSubject.value.role = res.role;
        this._currentUserSubject.value.userEmail = res.userEmail;
        this._currentUserSubject.value._id = res._id;
        const expiresAt = moment().add(res.expiresIn, "seconds");
        localStorage.setItem("id_token", res.token);
        localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()));
        // console.log(`expiresIn is ${res.expiresIn}. expiresAt is ${expiresAt}`);
        // console.log(`current route is ${this._router.url}`);
        if (localStorage.getItem("intendedUrl")) {
          this._router.navigateByUrl(localStorage.getItem("intendedUrl"));
        } else {
          this._router.navigateByUrl(res.redirect);
        }
        this.displayMsg = "Login Successful!";
      } else {
        this._currentUserSubject.value.isAuth = res.isAuth;
        localStorage.removeItem("id_token");
        localStorage.removeItem("expires_at");
        if (Object.keys(this._currentUserSubject.value).length>1) {
          delete this._currentUserSubject.value.username;
          delete this._currentUserSubject.value.userEmail;
          delete this._currentUserSubject.value.role;
          delete this._currentUserSubject.value._id;
        }
        this.displayMsg = "Invalid username or password!";
      }
    }, (error) => {
      if(error.status === 401){
        if(error.error.loginAttemptCounter){
          this.loginAttemptCounter = error.error.loginAttemptCounter;
        }
      }
    });
    return this.displayMsg
  }

  public checkLoginAttemptExceeded(): boolean{
    return this.loginAttemptCounter < 4 ? false : true;
  }

  rememberMe(checkStatus) {
    this.currentUserProfile.rememberMe = checkStatus;
  }

  logout() {
    // local strategy
    // this.posts = this._http.get(this.serverRootUrl + "/logout");
    // this._currentUserSubject.value.isAuth = false;
    // delete this._currentUserSubject.value.username;
    // delete this._currentUserSubject.value.role;
    // localStorage.removeItem("user");
    // sessionStorage.removeItem("user");

    // jwt strategy
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("newDesignHtml");
    localStorage.removeItem("newDesign");
    localStorage.removeItem("result");
    localStorage.removeItem("intendedUrl");
    localStorage.removeItem("reviewedResult");
    localStorage.removeItem("projectStatus");
    localStorage.removeItem("goal");
    this._currentUserSubject.value.isAuth = false;
    this._router.navigateByUrl("/login");
    //location.reload();
    this.reloadRequire=true;
  }

  getExpiration() {
    const expiration = localStorage.getItem("expires_at");
    const expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }

  public isLoggedIn() { //when token exists, only check expiration
    const notExpired = moment().isBefore(this.getExpiration());
    // console.log("notExpired: " + notExpired);
    if (notExpired) {
      // console.log("isLoggedIn(), isAuth = true");
      return notExpired
    } else {
      // console.log("isLoggedIn(), isAuth = false");
     return false
    }
  }

  public authenticateWithJwtTokenPromise() {
    this._spinner.show();
    var authResultPromise = new Promise ((resolve, reject) => {
      const headers = new HttpHeaders({"Content-type": "application/json"});
      this.posts = this._http
        .get(this.serverRootUrl + "/auth", {headers: headers})
        .toPromise()
        .then((res: any) => {
          if (res.isAuth) {
            this._currentUserSubject.value.isAuth = res.isAuth;
            this._currentUserSubject.value.username = res.username;
            this._currentUserSubject.value.userEmail = res.userEmail;
            this._currentUserSubject.value.role = res.role;
            this._currentUserSubject.value.projectAccess = res.projectAccess;
            this._currentUserSubject.value._id = res._id;
          } else {
            this._currentUserSubject.value.isAuth = res.isAuth;
            this._router.navigateByUrl("/login");
          };
          this._spinner.hide();
          resolve("")
        },
          err => {
            this._spinner.hide();
            this._currentUserSubject.value.isAuth = false;
            if (err.status == 401) {
              this._router.navigateByUrl("/login");
            } else if (err.status == 403) {
              // TODO: what to do when user access denied
            }
            reject(err);
          }
        );
    });
    return authResultPromise;
  }

  // isLoggedOut() {
  //   return !this.isLoggedIn();
  // }
}
