import { HttpClient } from "@angular/common/http";
import { Inject } from "@angular/core";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthenticationService, UserProfile } from "src/app/services/authentication.service";
import { DesignSettingsService } from "src/app/services/design-settings.service";
import { environment } from "src/environments/environment";
@Component({
  selector: "add-weakness-dialog",
  templateUrl: "add-weakness-dialog.html",
  styleUrls: ["add-weakness-dialog.css"]
})
export class AddWeaknessDialog implements OnInit {

  readonly featureRootUrl = environment.backendApiUrl + "features";
  weaknessForm: FormGroup;
  private unsubscribe: Subject<void> = new Subject();
  treatments: string[] = ["Yes", "No"];
  today = new Date();
  currentUserProfile: UserProfile;
  weaknessType = ["Software Development", "Hardware Design"];
  weaknessCategory = [
    [
      "API/Function Errors",
      "Audit / Logging Errors",
      "Authentication Errors ",
      "Authorization Errors ",
      "Bad Coding Practices",
      "Behavioral Problems",
      "Business Logic Errors",
      "Communication Channel Errors",
      "Complexity Issues",
      "Concurrency Issues",
      "Credentials Management Errors",
      "Cryptographic Issues",
      "Data Integrity Issues",
      "Data Neutralization Issues",
      "Data Processing Errors",
      "Data Validation Issues",
      "Documentation Issues",
      "Encapsulation Issues",
      "Error Conditions, Return Values, Status Codes",
      "Expression Issues",
      "File Handling Issues",
      "Handler Errors",
      "Information Management Errors",
      "Initialization and Cleanup Errors",
      "Key Management Errors",
      "Lockout Mechanism Errors",
      "Memory Buffer Errors",
      "Numeric Errors",
      "Permission Issues",
      "Pointer Issues",
      "Privilege Issues",
      "Random Number Issues",
      "Resource Locking Problems",
      "Resource Management Errors",
      "Signal Errors",
      "State Issues",
      "String Errors",
      "Type Errors",
      "User Interface Security Issues",
      "User Session Errors"
    ],
    [
      "Core and Compute Issues ",
      "Cross-Cutting Problems",
      "Debug and Test Problems",
      "General Circuit and Logic Design Concerns",
      "Integration Issues",
      "Manufacturing and Life Cycle Management Concerns",
      "Memory and Storage Issues",
      "Peripherals, On-chip Fabric, and Interface/IO Problems",
      "Power, Clock, and Reset Concerns",
      "Privilege Separation and Access Control Issues",
      "Security Flow Issues",
      "Security Primitives and Cryptography Issues"
    ]
  ];
  typeIndex: number = 0;

  constructor(private http: HttpClient, private _snackBar: MatSnackBar, @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddWeaknessDialog>, private _formBuilder: FormBuilder,
    private _authService: AuthenticationService,public editDesignShared: DesignSettingsService) { }

  ngOnInit() {
    this.weaknessForm = this._formBuilder.group({
      dateIdentified: "",
      identificationMethod: "",
      sourceNotes: "",
      component: "",
      attackSurface: "",
      asset: "",
      weaknessDescription: "",
      cweId: "",
      weaknessNumber: "",
      cweWeaknessType: "",
      cweWeaknessCategory: "",
      projectId: "",
      sourceLink:"",
      _id:""
    });
    if (this.data._id) {// If mode is updated then patch the form with row values
      this.weaknessForm.patchValue(this.data);
      if(this.data.cweWeaknessType == "Software Development"){
        this.typeIndex = 0;
      }else{
        this.typeIndex = 1;
      }
    }
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => {
        this.currentUserProfile = currentUser
      });
  }

  confirmChanges() {
    let data = this.weaknessForm.getRawValue();
    if(!this.data._id){
      delete data._id
    }
    this.dialogRef.close(data);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onNoClick(): void {
    // function to close dialog
    this.dialogRef.close();
  }

  typeChanged($event) {
    if($event.value=="Software Development"){
      this.typeIndex = 0;
    }else{
      this.typeIndex = 1;
    }
  }

}