import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthenticationService, UserProfile } from '../services/authentication.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";
  readonly systemConfigRootUrl = environment.backendApiUrl + "config";
  userName = "";
  userRole = "";
  subscribeEmail = "";
  changeEmail = "";
  emailRegEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  private unsubscribe: Subject<void> = new Subject();
  currentUserProfile: UserProfile;
  allowedDomains = []

  constructor(private _authService: AuthenticationService, private http: HttpClient,
    private _spinner: NgxSpinnerService, private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.http.get(this.systemConfigRootUrl + "/systemconfig").subscribe((res: any) => {// Get current allowed domains
      if (res.allowedDomains.length) {
        this.allowedDomains = res.allowedDomains
      }
    })
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser: any) => {
        this.currentUserProfile = currentUser
        this.userName = this.currentUserProfile.username;
        this.userRole = this.currentUserProfile.role;
        this.subscribeEmail = this.currentUserProfile?.userEmail ?? ""
      });
  }

  addEmail() {
    if (this.emailRegEx.test(this.subscribeEmail.toLowerCase()) || this.subscribeEmail == "") {// If email is a valid email or email field is empty
      let domainName = "";
      let fields = this.subscribeEmail.split('@')
      domainName = fields[1]?.toLowerCase()
      if (this.allowedDomains.includes(domainName) || this.subscribeEmail == "") {
        this._spinner.show()
        let user = {
          _id: this.currentUserProfile._id,
          email: this.subscribeEmail,
        }
        this.http.patch(this.secureduserRootUrl + "/admin", user).subscribe((res: any) => {
          if (res.msg && res.status == 200) {
            this._snackBar.open(res.msg,"", {duration: 4000});
            this._spinner.hide();
          } else {
            this._snackBar.open(res.msg, "", {duration: 3000})
            this._spinner.hide();
          }
        });
      } else {
        this._snackBar.open("Use allowed domains for your email address.", "", {
          duration: 3000,
        })
      }
    } else {
      this._snackBar.open("Enter a correct email address.", "", {
        duration: 3000,
      })
    }
  }
}
