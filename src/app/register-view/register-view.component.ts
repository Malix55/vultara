import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpRequest, HttpParams } from '@angular/common/http';
import { Role } from '../services/authentication.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface RegisterFields {
  username: string;
  password: string;
  role: Role;
}

@Component({
  selector: 'app-register-view',
  templateUrl: './register-view.component.html',
  styleUrls: ['./register-view.component.css']
})
export class RegisterViewComponent implements OnInit {
  registerFields: RegisterFields = {
    username: "",
    password: "",
    role: Role.securityEngineer,
  }
  posts: any;
  confirmPassword: string ="";
  userRoles = Object.values(Role);
  projects = ["BMW", "FCA"];
  selectedRole: string = "";
  constructor(private _http: HttpClient, private _router: Router) { }

  readonly rootUrl = environment.backendApiUrl + "user";
  private unsubscribe: Subject<void> = new Subject();

  ngOnInit(): void {
  }

  ngOnDestroy(){ 
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  
  registerConfirm() {
    console.log(this.registerFields);
    this.posts = this._http.post(this.rootUrl + "/register", this.registerFields);
    this.posts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        console.log(res);
        this._router.navigateByUrl(res.redirect);        
        // localStorage.setItem('result', JSON.stringify(res));
        // this._http.post("http://localhost:4200" + this.relativeUrlTableView, res);
        // this._router.navigateByUrl(this.relativeUrlTableView);
      });
  }

}
