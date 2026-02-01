import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ArrOpService } from 'src/app/services/arr-op.service';
import { Role } from 'src/app/services/authentication.service';
import { environment } from 'src/environments/environment';

interface UserAccountFields {
  username: string;
  password?: string;
  role: Role;
  projectAccessId: string[];
  _id?: string;
  userEmail?: string;
}
@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.css']
})
export class NewUserComponent implements OnInit, OnDestroy {
  userRoles = Object.values(Role);


  newUserRegForm = new FormGroup({
    'username': new FormControl('', Validators.required),
    'password': new FormControl('', Validators.required),
    'cpassword': new FormControl('', Validators.required),
    'role': new FormControl('Security Engineer', Validators.required),
    'projectAccessId': new FormControl([]),
    'userEmail': new FormControl('', Validators.email),
  });
  registerFields: UserAccountFields[] = [];
  readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";
  posts: any;
  private unsubscribe: Subject<void> = new Subject();
  domainError: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<NewUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _http: HttpClient
  ) { }

  ngOnInit(): void {
    if (this.data.user) {//if updating user disable password and confirmpassword validator
      this.newUserRegForm.patchValue(this.data.user);
      this.newUserRegForm.controls["password"].clearValidators();
      this.newUserRegForm.controls["password"].updateValueAndValidity();
      this.newUserRegForm.controls["cpassword"].clearValidators();
      this.newUserRegForm.controls["cpassword"].updateValueAndValidity();
    }
  }
  closeDialog(): void {
    this.dialogRef.close(false);
  }


  registerConfirm() {
    let email = this.newUserRegForm.controls['userEmail'].value.split('@');
    if(email == "" || this.data.allowedDomains.includes(email[1])){
      this.domainError = false
      this.registerFields = [];
      this.registerFields.push({
        username: this.newUserRegForm.controls['username'].value,
        password: this.newUserRegForm.controls['password'].value,
        role: this.newUserRegForm.controls['role'].value,
        projectAccessId: this.newUserRegForm.controls['projectAccessId'].value,
        userEmail: this.newUserRegForm.controls['userEmail'].value.toLowerCase()
      });
      if(this.data.user){//if updating user send patch request
        delete this.registerFields[0].password;
        this.registerFields[0]._id = this.data.user._id;
        this._http.patch(this.secureduserRootUrl + "/admin", { user: this.registerFields[0], userUpdate: true }).subscribe((res: any) => {
          if (res) {
            this.dialogRef.close(res)
          }
        })
      }else{//other wise register user
        //console.log(this.registerFields);
        this.posts = this._http.post(this.secureduserRootUrl + "/register", this.registerFields[0]);
        this.posts
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            this.dialogRef.close(res)
          });
      }
      this.newUserRegForm.reset();
    }else{
      this.domainError = true
    }
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

}
