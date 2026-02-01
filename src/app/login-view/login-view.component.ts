import { UserProfile, AuthenticationService } from './../services/authentication.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpRequest, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface LoginCredential {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login-view',
  templateUrl: './login-view.component.html',
  styleUrls: ['./login-view.component.css']
})
export class LoginViewComponent implements OnInit {
  // username: string;
  // password: string;
  loginCredential: LoginCredential = {
    username: "",
    password: ""
  }
  posts: any;
  rememberMe: boolean = false;
  displayMsg: string = "";
  constructor(private _http: HttpClient, private _router: Router, public authService: AuthenticationService) { }

  readonly serverRootUrl = environment.backendApiUrl + "user";
  private unsubscribe: Subject<void> = new Subject();
  // loginImage = "../../assets/images/vultara.jpg"; // Login Image Source
  loginImage = environment.loginImageDir;
  currentUserProfile: UserProfile;
  isAuthenticated: boolean;
  intendedUrl: string;

  ngOnInit() {
    // console.log("login-view is executed.");
    // this._authService.intendedUrlObservable.subscribe((url) => this.intendedUrl = url);
    const idToken = localStorage.getItem("id_token");
    if (idToken) {
      this.authService
      .authenticateWithJwtTokenPromise()
      .then((value) => {
        this.authService.currentUserObservable
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((currentUser) => this.currentUserProfile = currentUser);
      })
      .then((value) => {
        this.isAuthenticated = this.authService.isLoggedIn();
      })
      .then((value) => {
        if (this.isAuthenticated) {
          // console.log(`login-view component ngOnInit - intendedUrl is ${this.intendedUrl}`);
          if (localStorage.getItem("intendedUrl")) {// if there's a url the user wanted to go to
            // execute an emmiter to set current url for nav bar purposes.
            this.authService.emitCurrentUrlEvent();
            this._router.navigateByUrl(localStorage.getItem("intendedUrl"));
          } else {
            this._router.navigateByUrl("/dashboard")
          }
        }
      });
    }
    if(this.authService.reloadRequire){
        this.authService.reloadRequire=false;
        location.reload();
    }
  }

  ngOnDestroy(){
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  userLoginConfirm() {
    this.displayMsg = this.authService.login(this.loginCredential);
  }

  rememberMeChange(checked) {
    this.authService.rememberMe(checked);
  }

}
