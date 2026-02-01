import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { ReportsService } from 'src/app/services/reports.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notifications-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class NotificationsDetailsComponent implements OnInit, OnDestroy {
  readonly riskUpdateNotificationsUrl = environment.backendApiUrl + "riskUpdate";
  private unsubscribe: Subject<void> = new Subject();
  public riskUpdateNotifications: any[];
  public otherNotifications: any[] = [];
  public loadingDone: boolean = false;
  public loadingDoneVulnerability: boolean = false;
  public loadingDoneOtherNotifications: boolean = false;
  readonly vulnerabilityNotificationsUrl = environment.backendApiUrl + "vulnerability";
  readonly otherNotificationsUrl = environment.backendApiUrl + "otherNotifications";
  public vulnerabilityNotifications: any = [];
  selectedIndex: any;
  public projectId: string = '';
  newDesign = JSON.parse(localStorage.getItem("newDesign"));

  constructor(private router: Router, private _http: HttpClient, private _snackBar: MatSnackBar,
    public editDesignShared: DesignSettingsService, private _spinner: NgxSpinnerService, private route: ActivatedRoute,
    private notificationsService: NotificationsService, private reportsService: ReportsService
  ) { }

  ngOnInit(): void {
    this.makeNotificationAsRead();

    this.editDesignShared.projectIdObservable.subscribe((projectId: string) => {
      if (projectId) {
        this.projectId = projectId;

        if (!this.editDesignShared.projectStatus?.milestoneView) {//If !milestone load data normally
          this.getNotifications(projectId);
          this.getOtherNotifications(projectId);
          this.getVulnerabilityNotifications();
        }
      }
      });
    if (this.editDesignShared.projectStatus?.milestoneView) {//If milestone load data from milestone instead
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("find", "riskNotifications vulnerability otherNotifications").set("id",this.newDesign.project.id);
      this._spinner.show();
      this._http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        if (res) {
          this._spinner.hide();
          this.riskUpdateNotifications = res.riskNotifications;
          this.otherNotifications = res.otherNotifications;
          this.vulnerabilityNotifications = res.vulnerability;
        }
      })
    }

    this.route.queryParams.subscribe(params => {
      if (params.view == 'threat') {
        this.selectedIndex = 0;
      } else if (params.view == 'other') {
        this.selectedIndex = 2;
      } else {
        this.selectedIndex = 1;
      }
    })

    localStorage.setItem("intendedUrl", this.router.url);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // When a notification is clicked from anywhere of the application, that subscribes the notification to make it as read.
  private makeNotificationAsRead() {
    this.notificationsService.readNotification$.subscribe((data: any) => {
      if (data?.type == "otherNotification") {
        const i: number = this.otherNotifications.findIndex((__: any) => __._id == data.id);
        if (i > -1) {
          this.otherNotifications[i].readStatus = true;
        }
        this.notificationsService.readNotificationById();
      }
    })
  }

  // Fetch notifications information
  private getNotifications(projectId: string) {
    this._spinner.show();
    this._http.get(this.riskUpdateNotificationsUrl + "/all?projectId=" + projectId + "&skip=0").pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      this._spinner.hide();
      if (res) {
        if (res.length < 25) {
          this.loadingDone = true;
        }
        this.riskUpdateNotifications = res.filter(item => item.threatFeaLibAdvId);
      }
    });
  }

  // Fetch "Other Notifications" by project ID
  private getOtherNotifications(projectId: string) {
    this._spinner.show();
    this._http.get(this.otherNotificationsUrl + "/all?projectId=" + projectId + "&skip=0").pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      this._spinner.hide();
      if (res) {
        if (res.length < 25) {
          this.loadingDoneOtherNotifications = true;
        }
        this.otherNotifications = res;
      }
    });
  }

  // Load more notification upto last 3 months records
  public loadMore() {
    this._spinner.show();
    this._http.get(this.riskUpdateNotificationsUrl + "/all?projectId=" + this.projectId + "&skip=" + this.riskUpdateNotifications.length).pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      this._spinner.hide();
      if (res) {
        if (res.length < 25) {
          this.loadingDone = true;
        } else {
          this.riskUpdateNotifications = [...this.riskUpdateNotifications, ...res];
        }
      }
    });
  }

  // Move to a notification details
  public notificationDetails(notification: any, index: number) {
    if (!this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus.milestoneView == undefined) {
      const body = {
        projectId: this.projectId,
        threatRuleEngineId: notification.threatRuleEngineId,
        readStatus: true,
      }
      this.notificationsService.readNotificationById({ type: "riskUpdate", id: notification._id });
      if (!notification.readStatus) {
        this._http.post(this.riskUpdateNotificationsUrl + "/update-read-status", body).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (res) {
            this.riskUpdateNotifications[index] = res;
            this.router.navigate(["/threats"], { queryParams: { type: "riskUpdate", threatRuleEngineId: notification.threatRuleEngineId, projectId: this.projectId } });
          }
        });
      }else{
        this.router.navigate(["/threats"], { queryParams: { type: "riskUpdate", threatRuleEngineId: notification.threatRuleEngineId, projectId: this.projectId } });
      }
    }else{
      this.router.navigate(["/threats"], { queryParams: { type: "riskUpdate", threatRuleEngineId: notification.threatRuleEngineId, projectId: this.projectId } });
    }
  }

  // Move to a notification details
  public vulnerabilityNotificationDetails(notification: any, index: number) {
    if (!this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus.milestoneView == undefined) {
      const body = {
        notificationId: notification._id,
        projectId:this.projectId
      }
      if (!notification.isNotified) {
        this._http.post(this.vulnerabilityNotificationsUrl + `/${this.projectId}/notifications`, body).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (res) {
            this.notificationsService.readNotificationById({ type: "vulnerability", id: notification._id });
            this.vulnerabilityNotifications[index].isNotified = true;
            this.router.navigate([`vulnerabilities`], { queryParams: { id: notification._id } });
          }
        });
      }else{
        this.router.navigate([`vulnerabilities`], { queryParams: { id: notification._id } });
      }
    }else{
      this.router.navigate([`vulnerabilities`], { queryParams: { id: notification._id } });
    }
  }

  // Move to other notification details (update read status and download file)
  public otherNotificationDetails(notification: any, index: number) {
    if (!this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus.milestoneView == undefined) {
      this._spinner.show();
      let queryParams = new HttpParams().set("projectId", notification.projectId);
      this._http.post(this.otherNotificationsUrl + '/' + notification.projectId + '/notifications', { params: queryParams, 'notificationId': notification._id, projectId:notification.projectId}).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        if (res) {
          const i: number = this.otherNotifications.findIndex(obj => obj._id == notification._id);
          if (i > -1) {
            this.otherNotifications[i].readStatus = true;
            this.notificationsService.readNotificationById(this.otherNotifications[i]);
            this.notificationsService.readNotificationById({ type: "otherNotification", id: notification._id });
          }
          if (res.data && res.data.url) {
            this.reportsService.downloadTaraReportFromBrowser(res.data.url);
          } else {
            this._snackBar.open("The report does not exist.", "", {
              duration: 3000,
            });
          }
          this._spinner.hide();
        }
      }, error => {
        if (error.status === 404) {
          this._snackBar.open("The report does not exist.", "", {
            duration: 3000,
          });
        }
      });
    }else{
      this.router.navigate([`vulnerabilities`], { queryParams: { id: notification._id } });
    }
  }

  //get vulnerability notifications 
  private getVulnerabilityNotifications() {
    let params = new HttpParams().set("id", this.projectId);
    this._http.get(this.vulnerabilityNotificationsUrl + '/notifications/' + this.projectId + '/' + this.vulnerabilityNotifications.length,{params}).pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      this._spinner.hide();
      if (res) {
        if (res.length < 25) {
          this.loadingDoneVulnerability = true;
        }
        this.vulnerabilityNotifications = res;
      }
    });
  };

  // Load more vulnerabilities upto last 3 months records
  public loadMoreVulnerabilities() {
    this._spinner.show();
    let params = new HttpParams().set("id", this.projectId);
    this._http.get(this.vulnerabilityNotificationsUrl + '/notifications/' + this.projectId + '/' + this.vulnerabilityNotifications.length,{params}).pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      this._spinner.hide();
      if (res) {
        if (res.length < 25) {
          this.loadingDoneVulnerability = true;
        } else {
          this.vulnerabilityNotifications = [...this.vulnerabilityNotifications, ...res];
        }
      }
    });
  }

  // Load more "other notification" upto last 3 months records
  public loadMoreOtherNotifications() {
    this._spinner.show();
    let params = new HttpParams().set("id", this.projectId);
    this._http.get(this.otherNotificationsUrl + '/notifications/' + this.projectId + '/' + this.otherNotifications.length,{params}).pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      this._spinner.hide();
      if (res) {
        if (res.length < 25) {
          this.loadingDoneOtherNotifications = true;
        }
        this.otherNotifications = [...this.otherNotifications, ...res];
      }
    });
  }

}
