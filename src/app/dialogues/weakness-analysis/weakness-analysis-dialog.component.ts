import { HttpClient } from "@angular/common/http";
import { Inject } from "@angular/core";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthenticationService, UserProfile } from "src/app/services/authentication.service";
import { ConfirmDialogService } from "src/app/services/confirm-dialog.service";
@Component({
  selector: "weakness-analysis-dialog",
  templateUrl: "weakness-analysis-dialog.html",
  styleUrls: ["weakness-analysis-dialog.css"]
})
export class WeaknessAnalysisDialog implements OnInit {

  weaknessForm: FormGroup;
  private unsubscribe: Subject<void> = new Subject();
  treatments: string[] = ["Yes", "No",];
  edit = `Edit vulnerability No:${this.data.row.no}`;
  today = new Date();
  currentUserProfile: UserProfile;
  isExploitable: boolean = false;
  confirmToCancel = {
    title: "CONFIRMATION",
    message: "Are you sure you want to discard all of your analysis changes?",
    cancelText: "No",
    confirmText: "Yes",
    color:"primary"
  };
  confirmToDeLink = {
    title: "CONFIRMATION",
    message: "This will allow you to modify contents but will unlink all of your existing vulnerabilities. You can relink vulnerabilities if the exploitable is set to yes and the analysis review is checked",
    cancelText: "No",
    confirmText: "Yes",
    color:"primary"
  };
  deLink: boolean;
  disableAll = false;
  preRisk: string = "text";

  constructor(private http: HttpClient, private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<WeaknessAnalysisDialog>,
    private _formBuilder: FormBuilder, private _authService: AuthenticationService,
    private _confirmDialogService: ConfirmDialogService) {

    this.weaknessForm = this._formBuilder.group({
      _id: "",
      component: { value: "", disabled: true },
      attackSurface: { value: "", disabled: true },
      asset: { value: "", disabled: true },
      weaknessDescription: { value: "", disabled: true },
      weaknessNumber: "",
      exploitable: undefined,
      exploitableRationale: "",
      preControlRiskValue: "",
      riskRationale: "",
      analysisReviewed: { value: "", disabled: true },
      vulnerabilityAnalysis: data.row.vulnerabilityAnalysis
    });

    if(this.data.row.exploitable == "No"){
      this.preRisk = "text";
    }else{
      this.preRisk = "number";
    }


    if (this.data.row.analysisReviewed == true && this.data.row.exploitable == "No") {
      this.weaknessForm.controls.exploitable.disable();
      this.weaknessForm.controls.exploitableRationale.disable();
    }

    if (this.data.row.analysisReviewed == true && this.data.row.exploitable == "Yes") {
      this.weaknessForm.controls.exploitable.disable();
      this.weaknessForm.controls.exploitableRationale.disable();
      this.weaknessForm.controls.preControlRiskValue.disable();
      this.weaknessForm.controls.riskRationale.disable();
    }

    if (data.row?.exploitableRationale !== "" && data.row?.exploitable == "No") {
      this.weaknessForm.controls.analysisReviewed.enable();
      this.weaknessForm.controls.preControlRiskValue.disable();
      this.weaknessForm.controls.riskRationale.disable();
    }

    if (data.row?.exploitableRationale == "" && data.row?.exploitable == "No") {
      this.weaknessForm.controls.analysisReviewed.disable();
      this.weaknessForm.controls.preControlRiskValue.disable();
      this.weaknessForm.controls.riskRationale.disable();
    }

    if (data.row?.preControlRiskValue !== "" && data.row?.exploitable == "Yes"
      && data.row?.riskRationale !== ""
    ) {
      this.weaknessForm.controls.analysisReviewed.enable();
    }

  }

  ngOnInit() {
    this.weaknessForm.patchValue(this.data.row);
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => {
        this.currentUserProfile = currentUser
      });

    this.weaknessForm.controls.exploitableRationale.valueChanges.subscribe(res => {
      if (res !== "" && this.weaknessForm.controls.exploitable.value == "No") {
        this.weaknessForm.controls.analysisReviewed.enable();
      } else if (res == "" && this.weaknessForm.controls.exploitable.value == "No") {
        this.weaknessForm.controls.analysisReviewed.disable();
        this.weaknessForm.patchValue({ analysisReviewed: false })
      }
    })

    this.weaknessForm.controls.preControlRiskValue.valueChanges.subscribe(res => {
      if (res !== "" && this.weaknessForm.controls.exploitable.value == "Yes"
        && this.weaknessForm.controls.riskRationale.value !== ""
      ) {
        this.weaknessForm.controls.analysisReviewed.enable();
      } else {
        this.weaknessForm.controls.analysisReviewed.disable();
        this.weaknessForm.patchValue({ analysisReviewed: false });
      }
    })

    this.weaknessForm.controls.riskRationale.valueChanges.subscribe(res => {
      if (res !== "" && this.weaknessForm.controls.exploitable.value == "Yes"
        && this.weaknessForm.controls.preControlRiskValue.value !== ""
      ) {
        this.weaknessForm.controls.analysisReviewed.enable();
      } else {
        this.weaknessForm.controls.analysisReviewed.disable();
        this.weaknessForm.patchValue({ analysisReviewed: false });
      }
    })
  }

  confirmChanges() {
    let data = this.weaknessForm.getRawValue();
    let fields = [data.exploitableRationale, data.preControlRiskValue, data.riskRationale]
    if (fields.some(Boolean)) {
      data.vulnerabilityAnalysis = "In progress"
    } else if (!fields.some(Boolean) && data.exploitable == null) {
      data.vulnerabilityAnalysis = "Not started"
    }
    else if (data.exploitable == "Yes" || data.exploitable == "No") {
      data.vulnerabilityAnalysis = "In progress"
    }

    if (this.weaknessForm.controls.analysisReviewed.enabled) {
      data.vulnerabilityAnalysis = "Review required"
    }

    if (this.weaknessForm.controls.analysisReviewed.value == true &&
      this.weaknessForm.controls.analysisReviewed.enabled) {
      data.vulnerabilityAnalysis = "Completed";
    }
    data.deLink = this.deLink;
    this.dialogRef.close(data);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onNoClick(): void {
    this._confirmDialogService.open(this.confirmToCancel);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      if (confirmed) {
        this.dialogRef.close();
      }
    })
  }

  exploitableChanged(event) {
    if (event.value == "Yes") {
      if (this.weaknessForm.controls.preControlRiskValue.value == "N/A") {
        this.preRisk = "number";
        this.weaknessForm.patchValue({ preControlRiskValue: "", riskRationale: "" })
      }
      this.weaknessForm.controls.preControlRiskValue.enable();
      this.weaknessForm.controls.riskRationale.enable();
      if (this.weaknessForm.controls.preControlRiskValue.value !== "" &&
        this.weaknessForm.controls.riskRationale.value !== "") {
        this.weaknessForm.controls.analysisReviewed.enable();
      } else {
        this.weaknessForm.controls.analysisReviewed.disable();
      }
    } else if (event.value == "No") {
      this.preRisk = "text";
      this.weaknessForm.controls.riskRationale.disable();
      this.weaknessForm.controls.preControlRiskValue.disable();
      setTimeout(() => {
        this.weaknessForm.patchValue({ preControlRiskValue: "N/A", riskRationale: "N/A" });
        if (this.weaknessForm.controls.exploitableRationale.value !== "") {
          this.weaknessForm.controls.analysisReviewed.enable();
        } else {
          this.weaknessForm.controls.analysisReviewed.disable();
        }
      })
    }
  }

  changeAnalysis($event) {
    if (!$event.checked && this.data.row.vulnerabilityAnalysis == "Completed" && this.data.row.exploitable == "Yes") {
      this._confirmDialogService.open(this.confirmToDeLink);
      this._confirmDialogService.confirmed().subscribe((confirmed) => {
        if (confirmed) {
          this.deLink = true;
          this.weaknessForm.controls.exploitable.enable();
          this.weaknessForm.controls.exploitableRationale.enable();
          this.weaknessForm.controls.preControlRiskValue.enable();
          this.weaknessForm.controls.riskRationale.enable();
        } else {
          this.weaknessForm.patchValue({ analysisReviewed: true })
        }
      })
    } else if (!$event.checked && this.data.row.exploitable == "No") {
      this.weaknessForm.controls.exploitable.enable();
      this.weaknessForm.controls.exploitableRationale.enable();
    }
  }
}