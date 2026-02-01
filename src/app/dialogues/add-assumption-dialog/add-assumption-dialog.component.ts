import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { AuthenticationService, UserProfile } from "src/app/services/authentication.service";
import { DesignSettingsService } from "src/app/services/design-settings.service";

@Component({
  selector: 'add-assumption-dialog',
  templateUrl: './add-assumption-dialog.component.html',
  styleUrls: ['./add-assumption-dialog.component.css']
})
export class AddAssumptionDialogComponent implements OnInit {


  assumptionForm: FormGroup;
  private unsubscribe: Subject<void> = new Subject();
  edit = `Edit Assumption`;
  currentUserProfile: UserProfile;

  constructor(
    public dialogRef: MatDialogRef<AddAssumptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _formBuilder: FormBuilder,
    private _authService: AuthenticationService,
    public editDesignShared: DesignSettingsService
  ) { }

  ngOnInit(): void {
    this.assumptionForm = this._formBuilder.group({
      content: ["", [Validators.required, Validators.pattern(/.*[^ ].*/), Validators.minLength(3)]],
      rowNumber: this.data.row.no,
      lastModifiedBy: "",
      _id: ""
    });
    if (this.data.type == 'updated') {// If mode is updated then patch the form with row values
      this.assumptionForm.patchValue(this.data.row);
    } else {
      this.assumptionForm.patchValue({ assumptionSource: 'userManual' })
    }

    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => {
        this.currentUserProfile = currentUser
      });
    if (this.data.assumptionData) {
      this.assumptionForm.patchValue({ content: this.data.assumptionData.content })
    }
  }

  createAssumption() {
    let data = this.assumptionForm.getRawValue();
    data.lastModifiedBy = this.currentUserProfile._id,
      data.createdBy = this.currentUserProfile._id
    if (this.data.type == 'updated') {
      data.content = this.assumptionForm.value.content
    }
    this.dialogRef.close(data);
  }
  
  onNoClick(): void {
    // function to close dialog
    this.dialogRef.close(false);
  }
}
