import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { requireCheckboxesToBeCheckedValidator } from 'src/app/custom-validator/require-checkboxes-to-be-checked.validator';
import { AuthenticationService } from 'src/app/services/authentication.service';
@Component({
  selector: 'app-generate-report',
  templateUrl: './generate-report.component.html',
  styleUrls: ['./generate-report.component.css']
})
export class GenerateReportComponent implements OnInit, OnDestroy {
  reportContentGroup = new FormGroup({
    'project_risk_chart': new FormControl(false),
    'organization_risk_chart': new FormControl(false),
    'architecture_diagram': new FormControl(false),
    'high_risk_threat': new FormControl(false),
    'all_threat': new FormControl(false),
    'vulnerability_list': new FormControl(false),
  }, requireCheckboxesToBeCheckedValidator());
  subscriptions: Subscription[] = []
  isUserRoleAboveManager: Boolean
  
  constructor(
    public dialogRef: MatDialogRef<GenerateReportComponent>,
    private _authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this._authService.currentUserObservable
      .subscribe((currentUser) => {
        this.isUserRoleAboveManager = ["Super Admin", "Admin", "Security Manager"].includes(currentUser?.role)
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe())
  }

  // Get selected options values from the pop-up and send the values to parent component for preparing word report.
  generateReport() {
    if (this.reportContentGroup.valid) {
      this.dialogRef.close(this.reportContentGroup.value)
    }
  }

  // Disable generate report button if no option is selected.
  disableGenerateReportBtn() {
    for (const key in this.reportContentGroup.value) {
      if (this.reportContentGroup.value[key]) {
        return false
      }
    }
    return true
  }
}
