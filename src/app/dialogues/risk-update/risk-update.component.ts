import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { ResultSharingService } from 'src/app/services/result-sharing.service';
import { environment } from 'src/environments/environment';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';
import { Router } from '@angular/router';
export enum FeasibilityValue {
  Numeric = "Numeric",
  Enumerate = "Enumerate"
}

@Component({
  selector: 'app-risk-update',
  templateUrl: './risk-update.component.html',
  styleUrls: ['./risk-update.component.css']
})
export class RiskUpdateComponent implements OnInit, OnDestroy {
  FeasibilityValue: any = FeasibilityValue;
  feasibilityRatingAPRubrics: any;
  feasibilityValue: string = "Numeric";
  feasibilityMethod: any;
  feasibilityLevelName: any;
  feasibilityRating: any;
  private unsubscribe: Subject<void> = new Subject();
  public acceptRiskUpdate: boolean = false;
  public rejectRiskUpdate: boolean = false;
  public acceptRiskUpdateLoading: boolean = false;
  public rejectRiskUpdateLoading: boolean = false;

  readonly systemConfigRootUrl = environment.backendApiUrl + "config";
  readonly riskUpdateNotificationsUrl = environment.backendApiUrl + "riskUpdate";

  constructor(
    public dialogRef: MatDialogRef<RiskUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private resultShared: ResultSharingService,
    private _http: HttpClient,
    public editDesignShared: DesignSettingsService, private router:Router
  ) { }

  ngOnInit(): void {
    if (this.data.notification) {
      this.acceptRiskUpdate = this.data.notification.acceptStatus;
      this.rejectRiskUpdate = this.data.notification.rejectStatus;
    }

    this._http
      .get(this.systemConfigRootUrl + "/systemconfig")
      .pipe(take(1))
      .subscribe((res: any) => {
        this.feasibilityMethod = res.feasibilityMethod;
        this.feasibilityLevelName = res.feasibilityLevelName;
        this.feasibilityRating = res.feasibilityLevelName;
        this.feasibilityRatingAPRubrics = res.feasibilityRatingAPRubrics;
        this.feasibilityValue = res.feasibilityValue;
      })
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  closeRiskUpdateDialog() {
    this.dialogRef.close();
    this.router.navigateByUrl('/threats');
  }

  // Accept a riskUpdate notification
  acceptThreatRiskUpdate() {
    this.acceptRiskUpdateLoading = true;
    const threat: ThreatItem = {
      ...this.data.threat,
      attackFeasibilityElapsed: this.data.notification.attackFeasibilityElapsed,
      attackFeasibilityEquipment: Number(this.data.notification.attackFeasibilityEquipment),
      attackFeasibilityExpertise: Number(this.data.notification.attackFeasibilityExpertise),
      attackFeasibilityKnowledge: Number(this.data.notification.attackFeasibilityKnowledge),
      attackFeasibilityWindow: Number(this.data.notification.attackFeasibilityWindow),
    }
    const attackFeasibilityLevel = this.resultShared.rateFeasibility(threat, this.feasibilityMethod, this.feasibilityLevelName, this.feasibilityRating);
    
    this._http.post(this.riskUpdateNotificationsUrl + "/accept", { notification: this.data.notification, attackFeasibilityLevel,projectId:this.data.notification.projectId }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      this.acceptRiskUpdateLoading = false;
      if (res) {
        this.acceptRiskUpdate = true;
        this.rejectRiskUpdate = false;
        res.notification = this.data.notification;
        this.dialogRef.close(res);
      }
    });
  }

  // Reject a riskUpdate notification
  rejectThreatRiskUpdate() {
    this.rejectRiskUpdateLoading = true;
    const data={
      _id: this.data.notification._id,
      projectId:this.data.notification.projectId
    }
    this._http.post(this.riskUpdateNotificationsUrl + "/reject", data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      this.rejectRiskUpdateLoading = false;
      if (res) {
        this.rejectRiskUpdate = res.rejectStatus;
        this.acceptRiskUpdate = false;
        this.dialogRef.close({ rejected: true });
      }
    });
  }

}
