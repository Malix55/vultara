import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { NewUserComponent } from '../dialogues/new-user/new-user.component';
import { Role } from '../services/authentication.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { ArrOpService } from './../services/arr-op.service';
import { AuthenticationService, UserProfile } from './../services/authentication.service';

interface UserAccountFields {
  username: string;
  password?: string;
  role: Role;
  projectAccessId: string[];
  _id?: string;
  userEmail?: string;
}

@Component({
  selector: 'app-account-admin',
  templateUrl: './account-admin.component.html',
  styleUrls: ['./account-admin.component.css']
})
export class AccountAdminComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  emailList = [];
  allowedDomainsInitialLength: number;

  constructor(private fb: FormBuilder, private _http: HttpClient, private _router: Router, public dialog: MatDialog, private _confirmDialogService: ConfirmDialogService,
    private _snackBar: MatSnackBar, private _arrOp: ArrOpService, private _authService: AuthenticationService, private _spinner: NgxSpinnerService) {
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => this.currentUserProfile = currentUser);
    this.hideSelect(this.currentUserProfile?.role);
    let queryParams = new HttpParams().set("_id", this.currentUserProfile._id);
    // const headers = new HttpHeaders({"Content-type": "application/json"});
    this._http
      .get(this.projectRootUrl + "/getAllProjectIdsOfUser", { params: queryParams }) // get projects
      .pipe(take(1))
      .subscribe((res: any) => {
        if (res.id.length > 0) {
          for (let i = 0; i < res.id.length; i++) {
            this.projectList.push({ name: res.name[i], id: res.id[i] });
            this.projectListId.push(res.id[i]);
          }
        } else {
          if (res.msg) {
            this._snackBar.open(res.msg, "", {
              duration: 3000,
            })
          } else {
            this._snackBar.open("Network busy. Please refresh the page and try again.", "", {
              duration: 3000,
            })
          }
        }
      });
  }

  readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";
  readonly projectRootUrl = environment.backendApiUrl + "projects";

  projectList: any = [];
  projectListId: string[] = [];
  newProjectName: string;

  posts: any;
  userRoles = Object.values(Role);
  selectedRole: string = "";
  selectedProject = [];

  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA, SPACE] as const;
  allowedDomains = []

  readonly systemConfigRootUrl = environment.backendApiUrl + "config";
  currentUserProfile: UserProfile;
  private unsubscribe: Subject<void> = new Subject();

  confirmToDeleteUser = {
    title: "CONFIRM TO DELETE",
    message:
      "Are you sure you want to delete this user account?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  confirmToResetPassword = {
    title: "CONFIRM TO RESET",
    message:
      "Are you sure you want to reset this user password?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  userAccounts: UserAccountFields[] = [];
  updateUserForm: FormGroup;
  userAccountsArray = new FormArray([]);
  displayedColumns: string[] = ['userName', 'userRole', 'email', 'projectAccess', 'tableOp'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  ngOnInit(): void {
    this._spinner.show("account-spinner");
    this.updateUserForm = this.fb.group({
      userAccountsArray: this.fb.array([])
    });

    localStorage.setItem("intendedUrl", this._router.url);

    let params = new HttpParams().set("normal", "true")
    this._http.get(this.secureduserRootUrl + "/admin", { params }).subscribe((res: any) => {//Get all users data
      if(res.length){
        this.dataSource = new MatTableDataSource(res);
        this.dataSource.paginator = this.paginator;
        this._spinner.hide("account-spinner");
      }
    });

    this._http.get(this.systemConfigRootUrl + "/systemconfig").subscribe((res: any) => {
      if (res.allowedDomains.length) {//Get allowed domains
        this.allowedDomains = res.allowedDomains
        this.allowedDomainsInitialLength = res.allowedDomains.length
      }
    });

  }

  tabChanged($event){//If tab is changed without clicking update remove added domains
    if($event.index == 0 && this.allowedDomainsInitialLength < this.allowedDomains.length){
      const length = this.allowedDomains.length - this.allowedDomainsInitialLength
      this.allowedDomains = this.allowedDomains.slice(0,-Math.abs(length))
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }


  deleteUserAccount(id) {
    const i = this.dataSource.data.findIndex(item => item._id == id);
    this.confirmToDeleteUser.message =
    `Are you sure you want to delete ${this.dataSource.data[i].username}'s account?`
    this._confirmDialogService.open(this.confirmToDeleteUser);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      let queryParams = new HttpParams().set("_id", this.dataSource.data[i]._id);
      if (confirmed) {
        this.posts = this._http.delete(this.secureduserRootUrl + "/admin", { params: queryParams });
        this.posts
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if(res){
              this._snackBar.open(res.msg, "", {
                duration: 3000,
              })
              // this.refreshUserAccount();
              this.dataSource.data.splice(i, 1);
              this.dataSource.paginator = this.paginator;
            }
          });
      }
    })
  }

  resetPasswordUserAccount(user) { // Send the user an email with their new password
    this.confirmToResetPassword.message =
      `Are you sure you want to reset the password of ${user.username}'s account?`
    this._confirmDialogService.open(this.confirmToResetPassword);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      // let queryParams = new HttpParams().set("_id", this.dataSource.data[i]._id);
      if (confirmed) {
        const newPassword = this._arrOp.genRandomId(16);
        // const newPassword = "aaa";
        this._http.patch(this.secureduserRootUrl + "/admin", { user: user, newPassword, resetPassword: true }).subscribe((res: any) => {
          if (res.msg) {
            this._snackBar.open(res.msg, "", {
              duration: 3000,
            })
          }
        });
      }
    })
  }

  hideSelect(role) {
    if (role === 'Super Admin') {
      return this.userRoles;
    }
    else {
      this.userRoles.pop();
      this.userRoles.pop();
      this.userRoles.shift()
      return this.userRoles;
    }
  }

  //Update an existing user or add a new user
  openNewUserDialog(user?) {
    const dialogRef = this.dialog.open(NewUserComponent, {
      width: '600px',
      disableClose: true,
      data: { user, projectList: this.projectList, projectListId: this.projectListId, allowedDomains: this.allowedDomains }
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this._snackBar.open(result.msg, "", {
          duration: 3000,
        })
        if(result.user){//If existing user update the table data
          this.updateUserInTable(result.user);
        }

        if(result.newUser){//If a new user add a new user to the table
          this.updateUserInTable(result.user, "new")
        }
      }
    });
  }

  updateUserInTable(user, newUser?){//If newuser add them to the array else update existing user data
    if(newUser){
      this.dataSource.data.unshift(user);
      this.dataSource.paginator = this.paginator;
    }else{
      const rowIndex = this.dataSource.data.findIndex(item => item._id == user._id);
      this.dataSource.data[rowIndex] = user;
      this.dataSource.paginator = this.paginator;
    }
  }

  //Adds domain name to array if its valid
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const domainNamePattern = new RegExp(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)
      if (domainNamePattern.test(value)) {
        this.allowedDomains.push(value.toLowerCase());
        this._snackBar.open(
          "If you leave this page without updating the Domains, the newly added Domain will not be saved.",
         "", {
          duration: 3000,
        })
      } else {
        this._snackBar.open("Enter a valid domain name", "", {
          duration: 3000,
        })
      }
    }

    // Clear the input value
    event.input.value = ''
  }

  //Removes domain name from array if cross button is clicked
  remove(domain): void {
    let emailList = this.emailList.filter(item => item !== "" && item !== null);
    const index = this.allowedDomains.indexOf(domain);
    let ds = emailList.map(email => {
      let fields = email.split('@');
      let domainName = fields[1]?.toLowerCase();
      return domainName
    })
    const domainNames = [...new Set(ds)];

    if (index >= 0 && !domainNames.includes(domain)) {//Only remove domain if its not being used by any user in their email
      this.allowedDomains.splice(index, 1);
      this.allowedDomainsInitialLength = this.allowedDomainsInitialLength - 1;
    }else{
      this._snackBar.open("This domain is being used in a user's email and cannot be deleted.", "", {
        duration: 3000,
      })
    }
  }

  //Updates the allowedDomains array
  updateDomain() {
    this._spinner.show()
    this._http.patch(this.systemConfigRootUrl + "/systemconfig",
      { domains: this.allowedDomains }, { observe: 'response' }).subscribe((res: any) => {
        if (res.status == 200) {
          this._snackBar.open(res.body.msg, "", {
            duration: 3000,
          })
          this.allowedDomainsInitialLength = this.allowedDomains.length;
          this._spinner.hide()
        }
      }, (err) => {
        this._snackBar.open("There was an error trying to update your domain names", "", {
          duration: 3000,
        })
      })
  }

  getProjectName(id) {//Get project name from Id
    return this.projectList.find(item => item.id == id)?.name;
  }

}
