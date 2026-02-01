import { Wp29ThreatService } from './../services/wp29-threat.service';
import { Wp29MappingDialogComponent } from './../dialogues/wp29-mapping/wp29-mapping.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogService } from './../services/confirm-dialog.service';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { subscribeOn, takeUntil, catchError, take, filter, map } from 'rxjs/operators';
import { ResultSharingService } from './../services/result-sharing.service';
import { ComponentList, ThreatItem, ProjectType, ProjectHtml, ComponentMicro, ComponentControlUnit, ComponentCommLine, ComponentBoundary, WP29Model, CybersecurityGoal, Assumption } from './../../threatmodel/ItemDefinition';
import { DesignSettingsService } from './../services/design-settings.service';
import { AppHttpService } from './../services/app-http.service';
import { Component, OnInit, Inject, HostListener, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpParams, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ArrOpService } from '../services/arr-op.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserProfile, AuthenticationService } from './../services/authentication.service';
import { combineLatest, forkJoin, Observable, Subject } from 'rxjs';
import { SingleInputFormDialogService } from '../services/single-input-form-dialog.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import * as XLSX from "xlsx";
import * as moment from "moment";
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LoadMilestoneComponent } from '../dialogues/load-milestone/load-milestone.component';
import { ComponentVisualChangeService } from '../services/component-visual-change.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { CybersecurityGoalService } from '../services/cybersecurity-goal.service';
import { GenerateReportComponent } from '../dialogues/generate-report/generate-report.component';
import { Wp29ThreatMappingComponent } from '../dialogues/wp29-threat-mapping/wp29-threat-mapping.component';
import { RestoreThreatsComponent } from '../dialogues/restore-threats/restore-threats.component';
import { MitreAttackService } from '../services/mitre-attack.service';
import { NotificationsService } from '../services/notifications.service';

import { DomSanitizer } from '@angular/platform-browser';
import { NavbarService } from '../service/navbar.service';
import { VulnerabilityService } from '../services/vulnerability.service';
import { AssumptionService } from '../services/assumption.service';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  project: ProjectType = {
    id: "",
    name: "",
  };
  resultShared: ThreatItem[] = [];

  confirmToDeleteProjectDialogOptions = {
    title: "CONFIRM TO DELETE",
    message: "Are you sure you want to delete this project?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  @ViewChild('triggernotificationmenu') notificationMenu: MatMenuTrigger;

  constructor(private _http: HttpClient, public editDesignShared: DesignSettingsService, private _compVisual: ComponentVisualChangeService,
    private _router: Router, private _resultShared: ResultSharingService, private _ArrOp: ArrOpService, private mitreAttackService: MitreAttackService,
    public dialog: MatDialog, private _authService: AuthenticationService, private _confirmDialogService: ConfirmDialogService,
    private _singleInputFormDialogService: SingleInputFormDialogService, private _snackBar: MatSnackBar, private changeDetector: ChangeDetectorRef,
    private _spinner: NgxSpinnerService, public wp29ThreatService: Wp29ThreatService, private cybersecurityGoalService: CybersecurityGoalService,
    private _navbarService: NavbarService, private vulnerabilityService: VulnerabilityService, private reportsService: ReportsService,
    private notificationsService: NotificationsService, private assumptionService: AssumptionService
  ) {
    //#region Browser Detection
    const inBrowser = typeof window !== 'undefined'
    const UA = inBrowser && window.navigator.userAgent.toLowerCase()
    const isChrome = UA && /chrome|crios/i.test(UA) && !/opr|opera|chromium|edg|ucbrowser|googlebot/i.test(UA);

    if (!isChrome) {
      this.dialog.open(NotCompatibleBrowserDialog);
    }
    //#endregion
  }
  public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  public newDesign = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);
  readonly rootUrl = environment.backendApiUrl + "projects";
  readonly milestonesUrl = environment.backendApiUrl + "milestones";
  readonly rootUrlAssetLib = environment.backendApiUrl + "assets";
  readonly vulnerabilityNotificationsUrl = environment.backendApiUrl + "vulnerability";
  readonly otherNotificationsUrl = environment.backendApiUrl + "otherNotifications";
  readonly riskUpdateNotificationsUrl = environment.backendApiUrl + "riskUpdate";
  readonly backendGenerateReportApiUrl = environment.backendApiUrl + "reports";
  readonly assumptionUrl = environment.backendApiUrl + "assumption"
  readonly assetsUrl = environment.backendApiUrl + "assets";
  readonly relativeUrlThreatsView = "/threats";
  readonly relativeUrlTableVulnerabilityView = "/vulnerabilities";
  readonly relativeUrlTableWeaknessView = "/weaknesses";
  readonly relativeUrlModelingView = "/modeling";
  readonly relativeUrlLoginView = "/login";
  readonly relativeUrlDashboardView = "/dashboard";
  readonly relativeUrlAccountAdminView = "/accountAdmin";
  readonly relativeUrlNotificationsAdminView = "/notifications";
  readonly relativeUrlSecurityGoalAdminView = "/cybersecurity-goal";
  readonly relativeUrlSystemConfigView = "/systemConfig";
  readonly relativeUrlNavigationView = "/navigation";
  readonly relativeUrlDatabaseView = "/library";
  readonly vulnerabilitiesUrl = `${environment.backendApiUrl}vulnerability`;
  readonly protectModuleLicense = environment.protectModuleLicense;
  readonly relativeUrlAssumptionView = "/assumptions";
  readonly industryType = environment.industry;
  readonly relativeUrlHelpPage = "/help";
  readonly relativeUrlSecurityControlView = "/cybersecurity-control"
  public wp29Threats: any[] = [];
  public riskUpdateNotifications: any = [];
  public vulnerabilityNotifications: any = [];
  public otherNotifications: any = [];
  public assumptions: Assumption[] = []
  posts: any;
  projectData: any;
  currentUserProfile: UserProfile;
  currentUrl: string;
  helpMenuBtnDisabled: boolean = true;
  exportReportEnabled = environment.deploymentStatus;
  selectedProjectId: any;
  // isAuthenticated: boolean = this.currentUserProfile.isAuth;
  private unsubscribe: Subject<void> = new Subject();
  projectName = "";
  confirmToDeleteFeatureDialogOptions = {
    title: "CONFIRMATION",
    message: "This operation will delete all data in this project. Are you sure you want to proceed?",
    cancelText: "Cancel",
    confirmText: "Confirm"
  };
  confirmToStartOverRunTheModelDialogOptions = {
    title: "CONFIRMATION",
    message: "This operation will delete all previous threats, including Reviewed, in Threat List View. Are you sure you want to proceed?",
    cancelText: "Cancel",
    confirmText: "Confirm"
  };
  createNewProjectNameDialogOptions = {
    title: "NEW PROJECT",
    message: "Give the project a name...",
    cancelText: "Cancel",
    confirmText: "Confirm",
    input: this.newDesign.project.name,
  };
  changeProjectNameDialogOptions = {
    title: "EDIT PROJECT",
    message: "Update project name...",
    cancelText: "Cancel",
    confirmText: "Confirm",
    input: this.newDesign.project.name,
  };
  saveAsProjectDialogOptions = {
    title: "NEW PROJECT",
    message: "Give the project a name...",
    cancelText: "Cancel",
    confirmText: "Confirm",
    input: "New Project",
  };
  createNewMilestoneNameDialogOptions = {
    title: "NEW MILESTONE",
    message: "Give the milestone a name...",
    cancelText: "Cancel",
    confirmText: "Confirm",
    input: "",
  };
  verifyPasswordDialogOptions = {
    title: "Validate password",
    message: "Password",
    cancelText: "Cancel",
    confirmText: "Confirm",
    input: "",
  };
  versionNumber: String = environment.version;
  readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";

  public goals: CybersecurityGoal[] = [];
  selectedTab: String = 'threat';
  readonly dashboardRootUrl = environment.backendApiUrl + "dashboard";
  residualRiskChartLabel = [];
  residualRiskChartData = [];
  organizationalRiskChartLabel = [];
  organizationalRiskChartData = [];
  projectHtml: string = '';
  projectThreatList: ThreatItem[] = [];
  projectHighRiskThreatList: ThreatItem[] = [];
  ngOnInit() {
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => this.currentUserProfile = currentUser);
    this.editDesignShared.addToDesign
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((designData) => {
        this.newDesign = designData;
        this.wp29ThreatService.checkProjectStaus(this.newDesign.project.id);
        if (this.newDesign.project.name) { // so that projectName will stay as empty string, rather than undefined
          this.projectName = this.newDesign.project.name;
        }
    this.editDesignShared.setProjectStatus(this.newDesign.project.id);
        // console.log(this.projectName)
        // console.log(`newDesign.project id is ${this.newDesign.project.id}`);
        // console.log(`newDesign.project name is ${this.newDesign.project.name}`);
      });
    this._router.events.pipe(filter(event => event instanceof NavigationStart))
      .subscribe((res: any) => {
        this.currentUrl = res.url
      })
    this._navbarService.getSpinnerState().subscribe(state => {
      state ? this._spinner.show() : this._spinner.hide()
    })
    this.editDesignShared.projectIdObservable.subscribe((projectId: string) => {
      if (projectId) {
        this.project.id = projectId;
        if (!this.editDesignShared.projectStatus?.milestoneView) {//If !milestone load data normally
          this.getRiskUpdateNotifications(projectId);
          this.getVulnerabilityNotifications(projectId);
          this.getOtherNotifications(projectId);
        }
      }
    })
    if(this.editDesignShared.projectStatus?.milestoneView){//If milestone mode load data from milestone
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("find", "riskNotifications vulnerability otherNotifications").set("id",this.newDesign.project.id);
      this._http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        if (res) {
          this.riskUpdateNotifications = res.riskNotifications.filter(item => item.readStatus==false).slice(0, 20);
          this.otherNotifications = res.otherNotifications.filter(item => item.readStatus==false).slice(0, 20);
          this.vulnerabilityNotifications = res.vulnerability.filter(item => item.isNotified==false).slice(0, 20);
        }
      })
    }
    // console.log("navbar ngOnInit() is executed.");
    this.makeNotificationAsRead();
    if (this._authService.isLoggedIn()) { // this affects the account setting button
      //  this._authService.authenticateWithJwtTokenPromise();
      this.loadWP29AttackThreats();
    }
    this.initCybersecurityGoals();
    // console.log(this.currentUserProfile)
    
    this._resultShared.resultSharedObs
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resultData) => {
        this.resultShared = resultData;
      });
    this.currentUrl = localStorage.getItem("intendedUrl");

    // FOR CTRL + S IN MODELING PAGE
    this._confirmDialogService.getSaveProjectEventEmitter()
      .subscribe(() => {
        this.saveProject();
      });

    // FOR SETTING CURRENT URL AFTER INITAL REDIRECT FROM LOGIN SCREEN
    this._authService.setCurrentUrlEmitter
      .subscribe(() => {
        this.setCurrentUrl();
      });

    if (localStorage.getItem("newDesign")) {
      this.project = this.editDesignShared.localProjectInfoFromLocalStorage();
    };
    if (this.resultShared.length == 0 && localStorage.getItem("result")) {
      this._resultShared.loadLocalStorage();
    }
    this.initAssumptions();
  }

  selectTab(tab) {
    this.selectedTab = tab;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Check whether there is a new notification which is read and remove it from navbar notification menu
  private makeNotificationAsRead() {
    this.notificationsService.readNotification$.subscribe((data: any) => {
      if (data?.type == "vulnerability") {
        const i: number = this.vulnerabilityNotifications.findIndex((__: any) => __._id == data.id);
        if (i > -1) {
          this.vulnerabilityNotifications.splice(i, 1);
        }
        this.notificationsService.readNotificationById();
        this.closeMenu();
      } else if (data?.type == "riskUpdate") {
        const i: number = this.riskUpdateNotifications.findIndex((__: any) => __._id == data.id);
        if (i > -1) {
          this.riskUpdateNotifications.splice(i, 1);
        }
        this.notificationsService.readNotificationById();
        this.closeMenu();
      } else if (data?.type == "otherNotification") {
        const i: number = this.otherNotifications.findIndex((__: any) => __._id == data.id);
        if (i > -1) {
          this.otherNotifications.splice(i, 1);
        }
        this.notificationsService.readNotificationById();
        this.closeMenu();
      }
    });
  }

  // List all permanently deleted threats and restore upon selecting threats via checkbox from pop-up
  public restoreDeletedThreats() {
    const projectId: string = this.newDesign.project.id;
    const deletedThreatId: string[] = this.newDesign.project.deletedThreatId;

    if (this._resultShared.permanentlyDeletedThreatsLoaded) {
      this.openRestoreThreatsPopUp(projectId, this._resultShared.permanentlyDeletedThreats);
    } else {
      this.loadPermanentlyDeletedThreat(projectId, deletedThreatId);
    }
  }

  // Call API for the first time to load permanently deleted threats
  private loadPermanentlyDeletedThreat(projectId: string, deletedThreatId: string[]) {
    this._spinner.show();
    this._http
      .get(this.rootUrl + "/projectDeletedThreatListDb?id=" + projectId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this._resultShared.permanentlyDeletedThreatsLoaded = true;
        this._spinner.hide();
        if (res && res.threat) {
          this._resultShared.permanentlyDeletedThreats = this._resultShared.permanentlyDeletedThreats ? [...this._resultShared.permanentlyDeletedThreats, ...res.threat].filter((value: ThreatItem, index: number, self: ThreatItem[]) => self.findIndex((_: ThreatItem) => _.id === value.id) === index) : res.threat;
        }

        this.openRestoreThreatsPopUp(projectId, this._resultShared.permanentlyDeletedThreats);
      });
  }

  // Open dialog to list premanently deleted threats and restore
  private openRestoreThreatsPopUp(projectId: string, deletedThreat: ThreatItem[] = []) {
    const dialogRef = this.dialog.open(RestoreThreatsComponent, {
      minWidth: '800px',
      minHeight: '50vh',
      data: {
        projectId,
        deletedThreat
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((_: any) => {
        if (_) {
          this.newDesign.project.deletedThreatId = _.deletedThreatId;
          this.editDesignShared.updateEntireNewDesign(this.newDesign);
          const resultShared = [...this.resultShared, ..._.threat].filter((value: ThreatItem, index: number, self: ThreatItem[]) => self.findIndex((_: ThreatItem) => _.threatRuleEngineId === value.threatRuleEngineId) === index || "ATM");
          resultShared.sort((a: ThreatItem, b: ThreatItem) => (a.threatRowNumber > b.threatRowNumber) ? 1 : ((b.threatRowNumber > a.threatRowNumber) ? -1 : 0));
          this._resultShared.updateEntireResult(resultShared);
          this._resultShared.permanentlyDeletedThreats = this._resultShared.permanentlyDeletedThreats.filter((__: ThreatItem) => !_.threatRuleEngineId.includes(__.threatRuleEngineId));
        }
      });
  }

  // Get latest cybersecurity goal information
  private initCybersecurityGoals() {
    this.cybersecurityGoalService.cybersecurityGoal$.pipe(takeUntil(this.unsubscribe)).subscribe((_: CybersecurityGoal[]) => {
      if (_) {
        this.goals = _
      }
    })
  }

  private initAssumptions() {
    this.assumptionService.projectAssumption$.subscribe(res => {
      this.assumptions = res;
    })
  }
  public cybersecurityGoal() {
    this._router.navigateByUrl(this.relativeUrlSecurityGoalAdminView);
    this.currentUrl = this.relativeUrlSecurityGoalAdminView;
  }
  public cybersecurityControl() {
    this._router.navigateByUrl(this.relativeUrlSecurityControlView);
    this.currentUrl = this.relativeUrlSecurityControlView;
  }
  public switchToAssumptionsView() {
    this._router.navigateByUrl(this.relativeUrlAssumptionView);
    this.currentUrl = this.relativeUrlAssumptionView;
  }

  closeMenu() {
    this.selectedTab = 'threat';
    this.notificationMenu.closeMenu();
  }

  //get vulnerability notifications 
  private getVulnerabilityNotifications(projectId: string) {
    let queryParams = new HttpParams().set("projectId", projectId);
    this._http.get(this.vulnerabilityNotificationsUrl + '/' + projectId + '/notifications', { params: queryParams }).pipe(takeUntil(this.unsubscribe)).subscribe(res => {
      if (res) {
        this.vulnerabilityNotifications = res;
      }
    });
  }

  //get "Other notifications" by project ID.
  private getOtherNotifications(projectId: string) {
    let queryParams = new HttpParams().set("projectId", projectId);
    this._http.get(this.otherNotificationsUrl + '/' + projectId + '/notifications', { params: queryParams }).pipe(takeUntil(this.unsubscribe)).subscribe(res => {
      if (res) {
        this.otherNotifications = res;
      }
    });
  }

  //read vulnerability notifications 
  public readVulnerabilityNotification(notificationId) {
    if (!this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus.milestoneView == undefined) {
      this.notificationMenu.closeMenu();
      this._router.navigate([`vulnerabilities`], { queryParams: { id: notificationId } });
      let queryParams = new HttpParams().set("projectId", this.project.id);
      this._http.post(this.vulnerabilityNotificationsUrl + '/' + this.project.id + '/notifications', { params: queryParams, 'notificationId': notificationId, projectId:this.project.id }).pipe(takeUntil(this.unsubscribe)).subscribe(res => {
        if (res) {
          const i: number = this.vulnerabilityNotifications.findIndex(obj => obj._id == notificationId);
          if (i > -1) {
            this.vulnerabilityNotifications.splice(i, 1);
          }
        }
      });
    }else{
      this._router.navigate([`vulnerabilities`], { queryParams: { id: notificationId } });
    }
  }

  //read other notification (update read status and download the report).
  public readOtherNotification(notificationId: string) {
    if (!this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus.milestoneView == undefined) {
      this.notificationMenu.closeMenu();
      this._spinner.show();
      let queryParams = new HttpParams().set("projectId", this.project.id);
      this._http.post(this.otherNotificationsUrl + '/' + this.project.id + '/notifications', { params: queryParams, 'notificationId': notificationId, projectId:this.project.id}).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        if (res && res.data && res.data.url) {
          const i: number = this.otherNotifications.findIndex(obj => obj._id == notificationId);
          if (i > -1) {
            this.otherNotifications.splice(i, 1);
            this.notificationsService.readNotificationById({ type: "otherNotification", id: notificationId });
          }

          this.reportsService.downloadTaraReportFromBrowser(res.data.url);
          this._spinner.hide();
        }
      }, error => {
        if (error.status === 404) {
          this._snackBar.open("The report does not exist.", "", {
            duration: 3000,
          });
        } else {
          this._snackBar.open(error.message, "", {
            duration: 3000,
          });
        }
      });
    }
  }

  // Get risk update (unread, latest) notifications 
  private getRiskUpdateNotifications(projectId: string) {
    let queryParams = new HttpParams().set("projectId", projectId);
    this._http.get(this.riskUpdateNotificationsUrl, { params: queryParams }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => {
      if (res) {
        this.riskUpdateNotifications = res.filter(item => item.threatFeaLibAdvId);
      }
    });
  }

  // Action (change readStatus and open the threat in new browser tab) after clicking a risk update notification
  riskUpdateNotificationDetails(notification: any, index: number) {
    if (!this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus.milestoneView == undefined) {
      const newDesign = JSON.parse(localStorage.getItem("newDesign"));
      if (newDesign !== null) {
        const body = {
          projectId: newDesign.project.id,
          threatRuleEngineId: notification.threatRuleEngineId,
          readStatus: true,
        }
        // window.open(`/table?type=riskUpdate&threatRuleEngineId=${notification.threatRuleEngineId}&projectId=${newDesign.project.id}`);
        this._router.navigate(["/threats"], { queryParams: { type: "riskUpdate", threatRuleEngineId: notification.threatRuleEngineId, projectId: newDesign.project.id } });
        this.closeMenu();
        this._http.post(this.riskUpdateNotificationsUrl + "/update-read-status", body).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (res && res.readStatus) {
            const i: number = this.riskUpdateNotifications.findIndex(obj => obj._id == notification._id);
            if (i > -1) {
              this.riskUpdateNotifications.splice(i, 1);
            }
          }
        });
      }
    }else{
      this._router.navigate(["/threats"], { queryParams: { type: "riskUpdate", threatRuleEngineId: notification.threatRuleEngineId, projectId: this.newDesign.project.id } });
    }
  }

  showAllRiskUpdateNotifications() {
    this.notificationMenu.closeMenu();
    this._router.navigate(["/notifications"], { queryParams: { view: 'threat' } });
  }

  showAllVulnerabilityNotifications() {
    this.notificationMenu.closeMenu();
    this._router.navigate(["/notifications"], { queryParams: { view: 'vulnerability' } });
  }

  // Move to notifications page to view "Others" tab
  showAllOtherNotifications() {
    this.notificationMenu.closeMenu();
    this._router.navigate(["/notifications"], { queryParams: { view: 'other' } });
  }

  saveAsNewProject() {
    this._singleInputFormDialogService.open(this.saveAsProjectDialogOptions);

    this._singleInputFormDialogService
      .confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          this._router.navigateByUrl(this.relativeUrlModelingView);
          this.currentUrl = this.relativeUrlModelingView;
          localStorage.removeItem("newDesign");
          const currentId = this.newDesign.project.id;
          this.newDesign.project.id = this._ArrOp.genRandomId(20);
          this.patchPreviousDataToNewProject(currentId, confirmed)
          this.newDesign.project.name = confirmed;
          this.editDesignShared.updateProjectProperty(this.newDesign.project.id, "id");
          this.editDesignShared.updateProjectProperty(confirmed, "name");
          localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save the project id and name
          this.saveProject(true); // new project is saved in database upon creation
        }
      })
  }

  //Update the new project with previous project vulnerabilities, milestones and threatNotifications
  patchPreviousDataToNewProject(id, newProjectName) {
    const vulnerabilitiesUrl = `${environment.backendApiUrl}vulnerability/${this.newDesign.project.id}`
    let data = { "previousId": id }
    this._http.patch(vulnerabilitiesUrl, data).subscribe(res => { })
    this._http.patch(this.milestonesUrl + "/projectMilestoneDb", { projectId: id, newProjectId: this.newDesign.project.id, newProjectName }).subscribe(res => { })
    this._http.patch(this.riskUpdateNotificationsUrl, { projectId: id, newProjectId: this.newDesign.project.id, newProjectName }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any[]) => { })
  }

  changeProjectName() {
    this.changeProjectNameDialogOptions = {
      ...this.changeProjectNameDialogOptions,
      input: this.newDesign.project.name
    }

    this._singleInputFormDialogService.open(this.changeProjectNameDialogOptions);
    this._singleInputFormDialogService
      .confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          localStorage.removeItem("newDesign");
          this.newDesign.project.name = confirmed;
          this.editDesignShared.updateProjectProperty(confirmed, "name");
          localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save the project id and name
          this.posts = this._http.post(this.rootUrl + "/projectDb", {project:this.newDesign, projectId:this.newDesign.project.id}); // save a copy of design data in the backend database
          this.posts
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              if (res.micro.length > 0 || res.controlUnit.length > 0) {
                this._snackBar.open("Project information is successfully updated.", "", {
                  duration: 3000,
                })
              }
            });
        }
      })
  }

  createNewProject() {
    this.createNewProjectDialog();
  }
  createNewProjectDialog() {
    this._singleInputFormDialogService.open(this.createNewProjectNameDialogOptions);
    this._singleInputFormDialogService
      .confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          this._router.navigateByUrl(this.relativeUrlModelingView);
          this.currentUrl = this.relativeUrlModelingView;
          this._resultShared.emptyResult();
          this._resultShared.emptyBackupThreatList([]);
          // delete this.newDesign.project.notes; // No longer needed gets fixed by Main-720
          this.cybersecurityGoalService.updateCybersecurityGoals([]);
          localStorage.removeItem("newDesign");
          localStorage.removeItem("result");
          localStorage.removeItem("projectStatus");
          localStorage.removeItem("reviewedResult");
          localStorage.removeItem("newDesignHtml");
          localStorage.removeItem("goal");
          this.project = {
            id: "",
            name: ""
          };
          this.project.id = this._ArrOp.genRandomId(20);
          this.project.name = confirmed;
          this.newDesign = new ComponentList(this.project, [], [], [], []);
          if (document.getElementById("drawingCanvas") !== null) {
            document.getElementById("drawingCanvas").innerHTML = "";
          }
          this.project.deletedThreatId = [];
          // console.log(this.project.id)
          this.editDesignShared.updateProjectProperty(this.project.id, "id");
          // console.log(this.editDesignShared.addToDesign)
          this.editDesignShared.updateProjectProperty(confirmed, "name");
          localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save the project id and name
          this.saveProject(true); // new project is saved in database upon creation
        }
      })
  }
  deleteProject() {
    this._spinner.show();
    let queryParams = new HttpParams().set("_id", this.currentUserProfile._id);
    this.posts = this._http.get(this.rootUrl + "/getAllProjectIdsOfUser", { params: queryParams });
    this.posts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
        this._spinner.hide();
        if (res.id.length == 0) {
          this._snackBar.open("Project database server busy. Please try again.", "", {
            duration: 5000,
          });
        } else {
          //Find index of current project to disable it in delete dialog
          const index = res.id.findIndex(item => item == this.newDesign.project.id);
          this.deleteProjectDialog(res, index);
        }
      });
  }
  deleteProjectDialog(projectNameArray, index) {
    const dialogRef = this.dialog.open(DeleteProjectDialog, {
      // width: '700px',
      data: { projectNameArray, index },
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(result => {
        if (result) {
          let projectIndex = projectNameArray?.id?.indexOf(result);
          let projectName = projectNameArray?.name[projectIndex];
          this.confirmDeleteProjectDialog(result, projectName);
        }
      });
  }
  private confirmDeleteProjectDialog(projectId, projectName) {
    let message = "Are you sure you want to delete this project?";
    message = message.replace('?', ' ' + projectName + ' ?');
    this.confirmToDeleteProjectDialogOptions.message = message;
    this._confirmDialogService.open(this.confirmToDeleteProjectDialogOptions);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      if (confirmed) {
        this.confirmDeleteProject(projectId);
      } else {
        this._snackBar.open("No project is deleted.", "", { duration: 3000 });
      }
    });
  }
  private confirmDeleteProject(projectId: any) {
    let queryParams = new HttpParams().set("id", projectId);
    this._http.delete(`${this.secureduserRootUrl}/deleteProjectIdInUserProjectAccess`, { params: { id: projectId } })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    const deleteAssetUsedInProject$ = this._http.delete(this.assetsUrl + "/assetLib/usedInProjectId", { params: queryParams });
    deleteAssetUsedInProject$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    this.posts = this._http.delete(this.rootUrl + "/projectDb", { params: queryParams });
    this.posts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    let html = this._http.delete(this.rootUrl + "/projectHtmlDb", { params: queryParams });
    html
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    let result = this._http.delete(this.rootUrl + "/projectThreatListDb", { params: queryParams });
    result
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    let milestone = this._http.delete(this.milestonesUrl + "/projectMilestoneDb", { params: queryParams });
    milestone
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    const autoSavedPosts = this._http.delete(this.rootUrl + "/projectAutoSavedDb", { params: queryParams });
    autoSavedPosts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    const autoSavedResult = this._http.delete(this.rootUrl + "/projectAutoSavedThreatListDb", { params: queryParams });
    autoSavedResult
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    const autoSavedMilestone = this._http.delete(this.milestonesUrl + "/projectAutoSavedMilestoneDb", { params: queryParams });
    autoSavedMilestone
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });
    const deleteCybersecurityGoal = this._http.delete(this.rootUrl + "/cybersecurityGoals", { params: queryParams });
    deleteCybersecurityGoal
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    const projectDeletedThreatList = this._http.delete(this.rootUrl + "/projectDeletedThreatListDb", { params: queryParams });
    projectDeletedThreatList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    const projectThreatNotification = this._http.delete(this.rootUrl + "/projectThreatNotification", { params: queryParams });
    projectThreatNotification
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    const projectVulnerbilities = this._http.delete(`${this.vulnerabilitiesUrl}/${projectId}`);
    projectVulnerbilities
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    // Delete "Other" notifications by project ID
    const projectOtherNotifications = this._http.delete(`${this.otherNotificationsUrl}/projectOtherNotification`, { params: queryParams });
    projectOtherNotifications
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    let params = new HttpParams().set("projectDelete", projectId).set("id", this.newDesign.project.id);
    const projectControl = this._http.delete(this.rootUrl + '/projectControl', { params });
    projectControl
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    // Delete project assumptions
    const projectAssumptions = this._http.delete(this.rootUrl + "/projectAssumptions", { params: queryParams });
    projectAssumptions
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    // Delete project weakness
    const projectWeakness = this._http.delete(this.rootUrl + "/projectWeakness", { params: queryParams });
    projectWeakness
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res);
      });

    this._snackBar.open("Project deleted.", "", { duration: 3000 });
  }
  createNewDesign() {
    this._confirmDialogService.open(this.confirmToDeleteFeatureDialogOptions);
    this._confirmDialogService
      .confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          let queryParams = new HttpParams().set("id", this.newDesign.project.id);
          this._spinner.show();
          const projectThreatNotification = this._http.delete(this.rootUrl + "/projectThreatNotification", { params: queryParams });
          projectThreatNotification
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              this._spinner.hide();
              this._router.navigateByUrl(this.relativeUrlModelingView);
              this.currentUrl = this.relativeUrlModelingView;
              this._resultShared.emptyResult();
              this.newDesign = this.editDesignShared.removeAllComponents();
              localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save a copy of newDesign in local browser
              localStorage.removeItem("result");
              localStorage.removeItem("reviewedResult");
              localStorage.removeItem("projectStatus");
              localStorage.removeItem("newDesignHtml");
              localStorage.removeItem("goal");
              if (document.getElementById("drawingCanvas") !== null) {
                document.getElementById("drawingCanvas").innerHTML = "";
              }
              location.reload();
            });
          let paramsVuln = new HttpParams().set("id", this.newDesign.project.id);
          const projectVulnerbilities = this._http.delete(`${this.vulnerabilitiesUrl}/${this.newDesign.project.id}`, { params: paramsVuln });
          projectVulnerbilities
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });

          let params = new HttpParams().set("projectDelete", this.newDesign.project.id).set("id", this.newDesign.project.id);
          const projectControl = this._http.delete(this.rootUrl + '/projectControl', { params });
          projectControl
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
            const projectAssumptions = this._http.delete(this.rootUrl + "/projectAssumptions", { params: queryParams });
            projectAssumptions
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
            const projectWeakness = this._http.delete(this.rootUrl + "/projectWeakness", { params: queryParams });
            projectWeakness
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
            let newDesignParams = new HttpParams().set("newDesign", this.newDesign.project.id).set("id", this.newDesign.project.id);
            let threatList = this._http.delete(this.rootUrl + "/projectThreatListDb", { params: newDesignParams });
            threatList
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
          let deleteCybersecurityGoal = this._http.delete(this.rootUrl + "/cybersecurityGoals", { params: newDesignParams });
          deleteCybersecurityGoal
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
          let projectOtherNotifications = this._http.delete(`${this.otherNotificationsUrl}/projectOtherNotification`, { params: queryParams });
          projectOtherNotifications
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
          let milestone = this._http.delete(this.milestonesUrl + "/projectMilestoneDb", { params: queryParams });
          milestone
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
          let html = this._http.delete(this.rootUrl + "/projectHtmlDb", { params: newDesignParams });
          html
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
          let projectDesign = this._http.delete(this.rootUrl + "/projectDb", { params: newDesignParams });
          projectDesign
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            });
          let projectDeletedThreatList = this._http.delete(this.rootUrl + "/projectDeletedThreatListDb", { params: newDesignParams });
          projectDeletedThreatList
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              // console.log(res);
            }); 
        }
      })
  }

  executeProgram() {
    if (this._router.url == "/modeling") {
      if (this.newDesign.project.id) { // if the project has a name
        this._spinner.show();
        localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save a copy of newDesign in local browser
        localStorage.setItem('newDesignHtml', document.getElementById("drawingCanvas").innerHTML); // save a copy of newDesign in the local browser
        let localNewDesign = JSON.parse(localStorage.getItem("newDesign"));
        let localResult = [];
        if (localStorage.getItem("result")) {
          localResult = JSON.parse(localStorage.getItem("result"));
        }
        // if (localStorage.getItem("reviewedResult")) { // check whether reviewedResult should be appended to the result and sent to backend together
        //   let reviewedResultArray = JSON.parse(localStorage.getItem("reviewedResult"));
        //   reviewedResultArray.forEach(reviewedResultThreatItem => {
        //     let threatIndex = this._ArrOp.findStringIndexInArrayProperty(reviewedResultThreatItem.id, "id", localResult);
        //     if (threatIndex) { // if the id exists in localResult, ignore it

        //     } else { // if this threat is not in localResult, add to it
        //       localResult.push(reviewedResultThreatItem);
        //     }
        //   });
        // }
        // console.log(localNewDesign);
        const projectId = this.newDesign.project.id;
        this.posts = this._http.post(this.rootUrl + "/run", { designData: localNewDesign, resultData: localResult, projectId });
        this.posts
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res.length > 0) {
              this.updateCybersecurityGoalsThreatId(res, this.goals);
              this._resultShared.resetBackupThreatList(res);
              this._resultShared.updateEntireResult(res);
              localStorage.setItem('result', JSON.stringify(res));
              this._router.navigateByUrl(this.relativeUrlThreatsView);
              this.currentUrl = this.relativeUrlThreatsView;
              this.editDesignShared.updateProjectProperty(false, "mappedThreatList");
              // this.wp29ThreatService.processProjectStatusProperty(this.newDesign.project.id, "mappedThreatList", false);
            }
          });
      } else { // if the project doesn't have a name yet, not allowed to run
        this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
          duration: 5000,
        })
      }
    } else {
      this._snackBar.open("Please switch to the Modeling View to Run.", "Operation Failed.", {
        duration: 5000,
      })
    }
  }

  // Update Cybersecurity goal threatId parameter after run the project model
  private updateCybersecurityGoalsThreatId(threatList: ThreatItem[], goals: CybersecurityGoal[]) {
    if (goals.length > 0) {
      goals.forEach((_: CybersecurityGoal, goalIndex: number) => {
        goals[goalIndex].threatId.forEach((__: string, i: number) => {
          const threat: ThreatItem = threatList.find((___: ThreatItem) => __ === ___.id);
          if (!threat) {
            goals[goalIndex].threatId.splice(i, 1);
          }
        });
      });
      this.cybersecurityGoalService.updateCybersecurityGoals(goals);
      localStorage.setItem("goal", JSON.stringify(goals));
    }
  }

  executeProgramStartOver() {
    if (this._router.url == "/modeling") {
      if (this.newDesign.project.id) { // if the project has a name
        this._confirmDialogService.open(this.confirmToStartOverRunTheModelDialogOptions);
        this._confirmDialogService
          .confirmed()
          .subscribe(confirmed => {
            if (confirmed) {
              this._spinner.show();
              localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save a copy of newDesign in local browser
              localStorage.setItem('newDesignHtml', document.getElementById("drawingCanvas").innerHTML); // save a copy of newDesign in the local browser
              let localNewDesign = JSON.parse(localStorage.getItem("newDesign"));
              let localResult = [];
              this.posts = this._http.post(this.rootUrl + "/run", { designData: localNewDesign, resultData: localResult, project: { id: this.newDesign.project.id } });
              this.posts
                .pipe(takeUntil(this.unsubscribe))
                .subscribe((res) => {
                  // console.log(res);
                  if (res.length > 0) {
                    this._resultShared.emptyResult();
                    localStorage.removeItem("result");
                    localStorage.removeItem("reviewedResult");
                    this.newDesign.project.deletedThreatId = []
                    this._resultShared.permanentlyDeletedThreats = []
                    localStorage.setItem('newDesign', JSON.stringify(this.newDesign));// To clear localStorage permanentlyDeletedThreats
                    this._resultShared.resetBackupThreatList(res);
                    this._resultShared.updateEntireResult(res);
                    localStorage.setItem('result', JSON.stringify(res));
                    this._router.navigateByUrl(this.relativeUrlThreatsView);
                    this.currentUrl = this.relativeUrlThreatsView;
                    this.editDesignShared.updateProjectProperty(false, "mappedThreatList");
                    // this.wp29ThreatService.processProjectStatusProperty(this.newDesign.project.id, "mappedThreatList", false);
                  }
                });
            }
          })
      } else { // if the project doesn't have a name yet, not allowed to run
        this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
          duration: 5000,
        })
      }
    } else {
      this._snackBar.open("Please switch to the Modeling View to Run.", "Operation Failed.", {
        duration: 5000,
      })
    }
  }
  loadProject() {
    this._spinner.show();
    let queryParams = new HttpParams().set("_id", this.currentUserProfile._id);
    this.posts = this._http.get(this.rootUrl + "/getAllProjectIdsOfUser", { params: queryParams });
    this.posts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this._spinner.hide();
        // console.log(res);
        if (res.id.length == 0) {
          this._snackBar.open("User is not authorized to access any project, or project database server busy. Please try again.", "", {
            duration: 5000,
          });
        } else {
          this.loadProjectDialog(res)
        }
      });
  }
  loadProjectDialog(projectNameArray) {
    const dialogRef = this.dialog.open(LoadProjectDialog, {
      // width: '700px',
      data: projectNameArray,
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(result => {
        this.projectName = projectNameArray.id[result];
      });
  }
  loadProjectInfo() {
    const selectedProjectId = this.newDesign.project.id
    if (selectedProjectId) {
      this._spinner.show();
      let queryParams = new HttpParams().set("id", selectedProjectId);
      this.posts = this._http.get(this.rootUrl + "/projectDb", { params: queryParams });
      this.posts
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.projectInfoDialog(res)
          }
          this._spinner.hide();
        });
    }
    else {
      this._snackBar.open("No project is loaded", "Failed", {
        duration: 5000,
      });

    }

  }
  projectInfoDialog(projectData) {
    let currentUser = this.currentUserProfile.username;
    const dialogRef = this.dialog.open(ProjectInfoDialog, {
      width: '500px',
      data: { projectData, currentUser },
      disableClose: true
    });
  }
  saveProject(isNewProject?: boolean) {
    this.saveVulnerabilities();
    this._navbarService.saveButtonClicked()
    const updatedThreatList: ThreatItem[] = this._resultShared.getUpdatedThreatList(this.resultShared);
    if (this.newDesign.project.id) { // if the project has a name
      this.newDesign.project.threatListBottomPanel = this.mitreAttackService.mitreAttackBottomPanelType;
      localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save a copy of newDesign in local browser
      if (this._router.url == "/modeling") {
        const commLines = Array.from(document.getElementsByClassName("animationCommLineContainer1"));
        const images = Array.from(document.getElementsByClassName("animationIMGContainer1"));
        if (commLines.length > 0) {
          commLines.forEach((_: any) => {
            _.remove();
          });
        }
        if (images.length > 0) {
          images.forEach((_: any) => {
            _.remove();
          });
        }
        const drawingCanvas: any = document.getElementById("drawingCanvas").innerHTML;
        localStorage.setItem('newDesignHtml', drawingCanvas); // save a copy of newDesign in the local browser
      }
      localStorage.setItem('result', JSON.stringify(updatedThreatList)); // save a copy of the results in local browser
      this.goals = this.goals.filter(item => item.content.length !== 0)
      this.saveProjectInformationToDatabase(this.rootUrl, this.assetsUrl, this.newDesign, updatedThreatList, this.goals, isNewProject);
    } else { // if the project doesn't have a name yet, don't save
      this.newDesign.project = this.editDesignShared.localProjectInfoFromLocalStorage(); // try local storage first
      this.newDesign.project.threatListBottomPanel = this.mitreAttackService.mitreAttackBottomPanelType;
      if (this.newDesign.project.id) { // try it again. if the project has a name
        localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save a copy of newDesign in local browser
        if (this._router.url == "/modeling") {
          localStorage.setItem('newDesignHtml', document.getElementById("drawingCanvas").innerHTML); // save a copy of newDesign in the local browser
        }
        localStorage.setItem('result', JSON.stringify(updatedThreatList)); // save a copy of the results in local browser
        this.goals = this.goals.filter(item => item.content.length !== 0)
        this.saveProjectInformationToDatabase(this.rootUrl, this.assetsUrl, this.newDesign, updatedThreatList, this.goals, isNewProject);
      } else { // if even local storage doesn't have the project info, prop error
        this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
          duration: 5000,
        })
      }
    }
  }

  // Get data from vulnerability service and Save vulnerabilities
  saveVulnerabilities() {
    const newDesign = JSON.parse(localStorage.getItem("newDesign"));
    const vulnerabilitiesUrl = `${environment.backendApiUrl}vulnerability/${newDesign.project.id}`
    this._navbarService.toggleSpinner(true)
    if ((this.vulnerabilityService.updatedVulnerbilities.length + this.vulnerabilityService.addedVulnerabilities.length + this.vulnerabilityService.deletedVulnerabilities.length) > 0) {
      this._http.post(vulnerabilitiesUrl,
        { updated: this.vulnerabilityService.updatedVulnerbilities, deleted: this.vulnerabilityService.deletedVulnerabilities, added: this.vulnerabilityService.addedVulnerabilities })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(data => {
          this._navbarService.toggleSpinner(false)

          // If a new vulnerability was added send its _id to vulnerability component to update it
          if (this.vulnerabilityService.addedVulnerabilities.length) {
            this.vulnerabilityService.updateAddedIds(data);
          }
          this.vulnerabilityService.updatedVulnerbilities = []
          this.vulnerabilityService.deletedVulnerabilities = []
        })
    }
  }

  // Save a project information to database. Check whether a project is newly created than perform additional tasks.
  private saveProjectInformationToDatabase(rootUrl: string, assetUrl: string, newDesign: any, result: ThreatItem[], goals: CybersecurityGoal[], isNewProject?: boolean) {
    let localStorageHtmlData = localStorage.getItem("newDesignHtml");
    if (localStorageHtmlData?.length == 0 && !isNewProject) {
      this._snackBar.open("Data corrupted. Please switch to Modeling View to save project again.", "Failed", {
        duration: 4000,
      });
      this._spinner.hide();
      return
    }
    // let localStorageThreatData = JSON.parse(localStorage.getItem("result"));
    // console.log(localStorageThreatData)
    // console.log(result)
    // if (localStorageThreatData != result) {
    //   this._snackBar.open("Data corrupted. Please switch to Threat List View to save project again.", "Failed", {
    //     duration: 4000,
    //   });
    //   return
    // }
    let usedAssetId: string[] = [];
    [...newDesign.commLine, ...newDesign.micro, ...newDesign.controlUnit].map((_: any) => _.assetId).forEach((_: string[]) => {
      usedAssetId = [...usedAssetId, ...(_ ? _ : [])];
    });
    usedAssetId = [...new Set(usedAssetId)];
    const assetLibDb$: Observable<any> = this._http.put(assetUrl + "/assetLib/usedInProjectId", { assetId: usedAssetId, projectId: newDesign.project.id });
    const projectDb$: Observable<any> = this._http.post(rootUrl + "/projectDb", {project:newDesign,projectId:newDesign.project.id}); // save a copy of design data in the backend database

    let projectHtml: ProjectHtml = { // TODO: reconstruct HTML using design data, rather than loading HTML elements
      projectId: newDesign.project.id,
      html: localStorageHtmlData ? localStorageHtmlData : '',
    };
    const projectHtmlDb$: Observable<any> = this._http.post(rootUrl + "/projectHtmlDb", projectHtml); // save a copy of HTML in the backend database, for easier loading
    const deletedThreatsObj = {
      projectId: newDesign.project.id,
      threat: this._resultShared.permanentlyDeletedThreats
    }
    const projectDeletedThreatListDb$: Observable<any> = this._http.post(rootUrl + "/projectDeletedThreatListDb", deletedThreatsObj); // save a copy of the results in the backend database
    let resultObj = {
      projectId: newDesign.project.id,
      threat: result,
    }
    const projectThreatListDb$: Observable<any> = this._http.post(rootUrl + "/projectThreatListDb", resultObj); // save a copy of the results in the backend database
    const filteredGoals: CybersecurityGoal[] = goals.filter((_: CybersecurityGoal) => _.content.trim() !== "");
    const goalOnly = filteredGoals.filter(item => item.type !== 'control');
    let goalObj = {
      projectId: newDesign.project.id,
      goal: goalOnly,
    }
    localStorage.setItem("goal", JSON.stringify(goalOnly));
    const cybersecurityGoals$: Observable<any> = this._http.post(rootUrl + "/cybersecurityGoals", goalObj); // save a copy of the results in the backend database
    this._spinner.show();

    combineLatest([assetLibDb$, projectDb$, projectHtmlDb$, projectThreatListDb$, cybersecurityGoals$, projectDeletedThreatListDb$])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([assetLibDb, projectDb, projectHtmlDb, projectThreatListDb, cybersecurityGoals, projectDeletedThreatListDb]) => {
        this._spinner.hide();
        const goals = cybersecurityGoals.goal;
        goals.forEach(((item) => {
          if (item.type == 'goal') {
            const index = this.goals.findIndex(g => g.id == item.id);
            this.goals[index]._id = item._id;
          }
        }))
        this.cybersecurityGoalService.updateGoalId.next(true);
        this.cybersecurityGoalService.updateCybersecurityGoals(this.goals);
        if (!projectDb.micro) {
          this._snackBar.open("Project is NOT saved.", "Operation Failure", {
            duration: 3000,
          })
        }
        if (isNewProject) {
          document.getElementById("drawingCanvas").innerHTML = null;
        }

        //Reload once all requests have finished
        if (isNewProject && assetLibDb && projectDb && projectHtmlDb && projectThreatListDb && cybersecurityGoals && projectDeletedThreatListDb) {
          location.reload();
        }
        this._snackBar.open("Project information is successfully saved.", "", {
          duration: 3000,
        })
      });
  }

  saveResult() { // not accessible from navbar
    if (this.newDesign.project.id) { // if the project has a name
      localStorage.setItem('result', JSON.stringify(this.resultShared)); // save a copy of the results in local browser
      let resultObj = {
        projectId: this.newDesign.project.id,
        threat: JSON.parse(localStorage.getItem("result")),
      }
      this.posts = this._http.post(this.rootUrl + "/projectThreatListDb", resultObj); // save a copy of the results in the backend database
      this.posts
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          // console.log(res);
        });
    } else { // if the project doesn't have a name yet, don't save
      this.newDesign.project = this.editDesignShared.localProjectInfoFromLocalStorage(); // try local storage first
      if (this.newDesign.project.id) { // try it again. if the project has a name
        localStorage.setItem('result', JSON.stringify(this.resultShared)); // save a copy of the results in local browser
        let resultObj = {
          projectId: this.newDesign.project.id,
          threat: JSON.parse(localStorage.getItem("result")),
        }
        this.posts = this._http.post(this.rootUrl + "/projectThreatListDb", resultObj); // save a copy of the results in the backend database
        this.posts
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            // console.log(res);
          });
      } else {
        this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
          duration: 5000,
        })
      }
    }
  }
  scanResult() {
    this.saveResult();
    // rule 1: check if there are duplicate threatRuleEngineId
    let resultObj = {
      project: this.newDesign.project,
      threat: JSON.parse(localStorage.getItem("result")),
    };
    let resultThreatRuleEngineIdArray = [];
    resultObj.threat.forEach(threat => { // stores threatRuleEngineId
      if (threat.threatSource == "ruleEngine") { // only care ruleEngine generated threats
        resultThreatRuleEngineIdArray.push(threat.threatRuleEngineId);
      } else { // need to keep threats from other sources in order to use the index of priorResultThreatRuleEngineIdArray on priorResult array
        resultThreatRuleEngineIdArray.push("not applicable");
      }
    });
    let duplicateIdIndex = [];
    function findDuplicate(threatItem, threatItemIndex) {
      if (resultThreatRuleEngineIdArray.indexOf(threatItem.threatRuleEngineId) != threatItemIndex && resultThreatRuleEngineIdArray.indexOf(threatItem.threatRuleEngineId) >= 0) {
        duplicateIdIndex.push(threatItemIndex);
        duplicateIdIndex.push(resultThreatRuleEngineIdArray.indexOf(threatItem.threatRuleEngineId));
        return true
      } else {
        return false
      }
    }
    let dupliateIdArray = resultObj.threat.filter(findDuplicate);
    // console.log(duplicateIdIndex);
    // console.log(dupliateIdArray);
    let issueFound: boolean = false;
    if (duplicateIdIndex.length > 0) {
      for (let i = 0; i < duplicateIdIndex.length; i++) {
        this._resultShared.updateResult(duplicateIdIndex[i], "_highlight", "highlight");
        resultObj.threat[duplicateIdIndex[i]].highlight = "_highlight";
      }
      localStorage.setItem('result', JSON.stringify(resultObj.threat));
      // this._resultShared.updateEntireResult(resultObj.threat);
      this._resultShared.loadLocalStorage();
      this._snackBar.open("Threats in question are highlighted. Check more in formation in notes of each highlighted threat.", "Attention required.", {
        duration: 5000,
      });
      issueFound = true;
    }

    const nickNameUpdated: boolean = this.updateThreatListNickName(this.newDesign, resultObj.threat);
    if (nickNameUpdated) {
      this._snackBar.open("Component names are updated to match the changes in the model.", "", {
        duration: 3000,
      });
      issueFound = true;
    }

    if (!issueFound) {
      this._snackBar.open("No issues found.", "", {
        duration: 3000,
      });
    }
  }

  executeProtectProgram() {
    localStorage.setItem('result', JSON.stringify(this.resultShared)); // save a copy of the results in local browser
    if (this.resultShared.length == 0) {
      this._snackBar.open("No threats to protect for. The Protect Module only works with 'Reviewed' threats.", "Failed", {
        duration: 4000,
      });
    } else {

    }
  }

  // Generate report according to options selection from popup
  generateReport() {
    const dialogRef = this.dialog.open(GenerateReportComponent, { width: '300px' })
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        let payload = {
          ...result,
          user: this.currentUserProfile,
          project: this.newDesign.project,
          projectId: this.newDesign.project.id
        }
        this._http.post(this.backendGenerateReportApiUrl + "/generateTaraReportInWord", payload).subscribe((res: any) => {
          this._snackBar.open(res.message, "", {
            duration: 5000
          });
        }, (error) => {
          if (error && error.message) {
            this._snackBar.open(error.message, "", {
              duration: 5000
            });
          }
        });
      }
    })
  }

  private updateThreatListNickName(newDesign: ComponentList, result: ThreatItem[] = []) {
    const components: any[] = [...newDesign.boundary, ...newDesign.commLine, ...newDesign.controlUnit, ...newDesign.micro];
    let nickNameUpdated: boolean = false;
    result.forEach((threatItem: ThreatItem, index: number) => {
      const component = components.find(obj => obj.id === threatItem.moduleId);
      if (component) {
        if (component.nickName !== threatItem.nickName) {
          nickNameUpdated = true;
          result[index].nickName = component.nickName;
        }
      }
    });

    localStorage.setItem('result', JSON.stringify(result));
    this._resultShared.loadLocalStorage();
    return nickNameUpdated;
  }

  checkWP29() {
    this.saveResult();
    let dataToSend = {
      newDesign: this.newDesign,
      threat: JSON.parse(localStorage.getItem("result")),
      project: {
        id: this.newDesign.project.id
      }
    }
    this._spinner.show();
    this.posts = this._http.post(this.rootUrl + "/wp29Threats", dataToSend); // save a copy of the results in the backend database
    this.posts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this._spinner.hide();
        if (res && typeof res === "object" && res.length > 0) {
          this._resultShared.updateEntireResult(res);
          // temporary fix...
          // POST /wp29Threats has the WP29 algorithm Part 1
          // generateAdditionalWP29Threats() function has the WP29 algorithm Part 2
          // Now I'm putting Part 2 inside Part 1, and use the returned Part 1 results as the input to Part 2 function
          // need to merge these two WP29 algorithms
          this.generateAdditionalWP29Threats(this.resultShared);
          localStorage.setItem('result', JSON.stringify(res));
          // this._resultShared.loadLocalStorage();
          this.editDesignShared.updateProjectProperty(true, "mappedThreatList");
          // this.wp29ThreatService.processProjectStatusProperty(this.newDesign.project.id, "mappedThreatList", true);
        }
      });

    this._http
      .delete(`${this.rootUrl}/wp29ThreatIndexes?id=${this.project.id}`)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: WP29Model[]) => {
        if (res) {
          this.editDesignShared.updateProjectProperty(res, "wp29");
          this.newDesign.project.wp29 = res;
          this.project.wp29 = res;
          localStorage.setItem('newDesign', JSON.stringify(this.newDesign));
        }
      });
  }

  // Show pop-up for user input before generating merged threats or update existing threats.
  private showModelForWP29Threats(threats: ThreatItem[]) {
    const dialogRef = this.dialog.open(Wp29ThreatMappingComponent, {
      width: "600px",
      data: {
        threats,
        newDesign: this.newDesign
      },
      disableClose: true
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((Wp29ThreatMappingComponentReturnedValue: any) => {
        if (Wp29ThreatMappingComponentReturnedValue) {
          threats = threats.filter((threat: ThreatItem) => threat.threatSource !== "wp29RuleEngine");

          threats = threats.map((threatsToReturn: ThreatItem) => {
            const threatExist: ThreatItem = Wp29ThreatMappingComponentReturnedValue.threatsToUpdate.find(
              (relevantThreats: ThreatItem) =>
                threatsToReturn.id === relevantThreats.id && threatsToReturn.threatRowNumber === relevantThreats.threatRowNumber);
            if (threatExist) {
              return threatExist;
            } else {
              return threatsToReturn;
            }
          });

          this.updateNotApplicableWP29AttackIndex(Wp29ThreatMappingComponentReturnedValue.notApplicableWP29AttackIndex);

          const newThreats: ThreatItem[] = [...threats, ...Wp29ThreatMappingComponentReturnedValue.hardCodedThreats];
          this._resultShared.updateEntireResult(newThreats);

          this._snackBar.open("WP29 threat mapping is successfully done.", "", {
            duration: 3000,
          });
        }
      });
  }

  // Update newDesign project property notApplicableWP29AttackIndex
  private updateNotApplicableWP29AttackIndex(notApplicableWP29AttackIndex: string[]) {
    if (this.newDesign && this.newDesign.project) {
      const newDesignProject = {
        ...this.newDesign.project,
        notApplicableWP29AttackIndex
      };
      const newDesign = {
        ...this.newDesign,
        project: newDesignProject
      }

      this.editDesignShared.updateEntireNewDesign(newDesign);
    }
  }

  // Show pop-up for user input and create threats from WP29AttackIndex and logic
  private generateAdditionalWP29Threats(threats: ThreatItem[]) {
    if (this.wp29ThreatService.assetLib.length <= 0) {
      this._spinner.show();
      this._http
        .get(`${this.rootUrlAssetLib}/assetLibByType?assetType=dataInTransit,dataAtRest`)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: WP29Model[]) => {
          this._spinner.hide();
          if (res) {
            this.wp29ThreatService.assetLib = res;

            this.showModelForWP29Threats(threats);
          }
        });
    } else {
      this.showModelForWP29Threats(threats);
    }
  }

  exportWP29ReportToExcel() {

  }
  showMapping() {
    const dialogRef = this.dialog.open(Wp29MappingDialogComponent, {
      data: {
        threats: this.wp29Threats,
        result: this.resultShared,
        project: this.project
      },
      disableClose: true
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(result => {

      });
  }
  private loadWP29AttackThreats() {
    this._http
      .get(this.rootUrl + "/wp29Threats")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (res && res.length > 0) {
          this.wp29Threats = res;
        }
      });
  }

  // Get latest threatlist information, update it to localstorage. Filter the threatlist if necesary.
  private getFilteredThreatList(): ThreatItem[] {
    localStorage.setItem('result', JSON.stringify(this.resultShared)); // save a copy of the results in local browser
    let originalTable = JSON.parse(localStorage.getItem("result"));
    let filteredReviewedTable = [];
    // reviewedTable.forEach(threatItem => {  // remove duplicates
    //   if (this._ArrOp.findStringIndexInArrayProperty(threatItem.id, "id", originalTable) == undefined) { // returns undefined if no match is found
    //     filteredReviewedTable.push(threatItem)
    //   };
    //   return filteredReviewedTable;
    // });
    // console.log(filteredReviewedTable)
    // console.log(filteredReviewedTable.length)
    let mergedTable = [];
    if (filteredReviewedTable.length > 0) {
      mergedTable = filteredReviewedTable.concat(originalTable);
    } else {
      mergedTable = originalTable;
    }
    return mergedTable;
  }

  // Root function to export report in excel
  exportReportToExcel() {
    var workBook: XLSX.WorkBook = XLSX.utils.book_new();
    workBook.Props = {
      Title: "TARA Report",
      Author: this.currentUserProfile.username,
    };
    workBook.SheetNames.push("CoverSheet");
    // cover page content
    const coverSheetData = this.reportsService.getCoverSheetData(this.newDesign.project.name, this.currentUserProfile.username);
    workBook.Sheets["CoverSheet"] = XLSX.utils.aoa_to_sheet(coverSheetData);
    // main content
    // let reviewedTable = JSON.parse(localStorage.getItem("reviewedResult"));
    const mergedTable: ThreatItem[] = this.getFilteredThreatList();
    const outputTable = this.reportsService.getThreatListData(mergedTable);
    const threatListWorkSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(outputTable);
    XLSX.utils.book_append_sheet(workBook, threatListWorkSheet, 'Threat');

    this._spinner.show();
    let queryParams = new HttpParams().set("type", "all").set("projectId",this.newDesign.project.id);
    const vulnerabilityList$: Observable<any> = this._http.get(this.vulnerabilityNotificationsUrl + '/' + this.newDesign.project.id, { params: queryParams });
    const assumptionList$: Observable<any> = this._http.get(this.assumptionUrl + "/" + this.newDesign.project.id,{params: queryParams});
    // Call multiple API requests at a time to get the response data together.
    forkJoin([vulnerabilityList$, assumptionList$]).pipe(takeUntil(this.unsubscribe)).subscribe(([vulnerabilities, assumptions]) => {
      this._spinner.hide();
      if (vulnerabilities && assumptions) {
        // Vulnerability section
        const vulnerabilitiesTableData = this.reportsService.getVulnerabilityData(vulnerabilities);
        const vulnerabilitiesWorkSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(vulnerabilitiesTableData);
        XLSX.utils.book_append_sheet(workBook, vulnerabilitiesWorkSheet, 'Vulnerability');
        // Assumption section
        const assumptionsTableData = this.reportsService.getAssumptionData(assumptions);
        const assumptionsWorkSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(assumptionsTableData);
        XLSX.utils.book_append_sheet(workBook, assumptionsWorkSheet, 'Assumptions');
      }
      /* save to file */
      XLSX.writeFile(workBook, "TARA Report.xlsx");
    }, error => {
      /* save to file */
      XLSX.writeFile(workBook, "TARA Report.xlsx");
    });
  }
  // loadResult() {
  //   location.reload();
  //   this.resultShared = JSON.parse(localStorage.getItem("result"));
  //   this._resultShared.loadLocalStorage();
  //   this.dataSource = new MatTableDataSource(this.resultShared);
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  // }
  switchToDashboardView() {
    this._router.navigateByUrl(this.relativeUrlDashboardView);
    this.currentUrl = this.relativeUrlDashboardView;
  }
  switchToTableView() {
    this._router.navigateByUrl(this.relativeUrlThreatsView);
    this.currentUrl = this.relativeUrlThreatsView;
  }
  //open vulnerability listing view
  switchToVulnerabilityView() {
    this._router.navigateByUrl(this.relativeUrlTableVulnerabilityView);
    this.currentUrl = this.relativeUrlTableVulnerabilityView;
  }
  switchToWeaknessView() {
    this._router.navigateByUrl(this.relativeUrlTableWeaknessView);
    this.currentUrl = this.relativeUrlTableWeaknessView;
  }
  switchToModelingView() {
    this._router.navigateByUrl(this.relativeUrlModelingView);
    this.currentUrl = this.relativeUrlModelingView;
  };
  switchToLoginView() {
    this._router.navigateByUrl(this.relativeUrlLoginView);
    this.currentUrl = this.relativeUrlLoginView;
  }
  switchToSystemConfigView() {
    this._router.navigateByUrl(this.relativeUrlSystemConfigView);
    this.currentUrl = this.relativeUrlSystemConfigView;
  }
  switchToAccountAdminView() {
    this._router.navigateByUrl(this.relativeUrlAccountAdminView);
    this.currentUrl = this.relativeUrlAccountAdminView;
  }
  switchToDatabaseView() {
    this._router.navigateByUrl(this.relativeUrlDatabaseView);
    this.currentUrl = this.relativeUrlDatabaseView;
  }
  switchToNotifications() {
    this._router.navigateByUrl(this.relativeUrlNotificationsAdminView);
    this.currentUrl = this.relativeUrlNotificationsAdminView;
  }
  switchToNavigationView() {
    if (this.industryType == "automotive") {
      this._router.navigateByUrl(this.relativeUrlNavigationView);
      this.currentUrl = this.relativeUrlNavigationView;
    }
  }
  switchToHelpPage() {
    this._router.navigateByUrl(this.relativeUrlHelpPage);
    this.currentUrl = this.relativeUrlHelpPage;
  }
  logout() {
    this._authService.logout();
  }

  setCurrentUrl() {
    this.currentUrl = localStorage.getItem('intendedUrl');
  }

  createNewMilestone() {
    localStorage.setItem('result', JSON.stringify(this.resultShared)); // save a copy of the results in local browser
      this._singleInputFormDialogService.open(this.createNewMilestoneNameDialogOptions);
      this._singleInputFormDialogService
        .confirmed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.saveProject()
            this.microList = [];
            this.controlUnitList = [];
            this.lineList = [];
            this.boundaryList = [];
            this.newDesign = this.editDesignShared.loadLocalStorage(this.microList, this.controlUnitList, this.lineList, this.boundaryList); // load newDesign from localStorage
            this.newDesign.project.milestoneName = confirmed;
            this.newDesign.project.milestoneId = this._ArrOp.genRandomId(10);
            let projectId = this.newDesign.project.id;
            let queryParams = new HttpParams().set("projectId", projectId).set("mode","all");
            let otherParams = new HttpParams().set("milestone", 'true')
            let $vulnerability = this._http.get(`${environment.backendApiUrl}vulnerability/${this.newDesign.project.id}`).pipe(takeUntil(this.unsubscribe));
            let $otherNotifications = this._http.get(this.otherNotificationsUrl + '/' + projectId + '/notifications', { params: otherParams });
            let $riskNotifications = this._http.get(this.riskUpdateNotificationsUrl, { params: queryParams });
            let $assumptions = this._http.get(`${environment.backendApiUrl}assumption/${this.newDesign.project.id}`);
            let $weakness = this._http.get(`${environment.backendApiUrl}weakness/${this.newDesign.project.id}`);
            let $control = this._http.get(`${environment.backendApiUrl}projects/projectControl?id=${this.newDesign.project.id}`);
            combineLatest([$otherNotifications,$riskNotifications,$vulnerability,$assumptions,$weakness,$control])
              .pipe(takeUntil(this.unsubscribe))
              .subscribe(([otherNotifications,riskNotifications,vulnerability,assumptions,weakness,control]) => {
                if(otherNotifications && riskNotifications && vulnerability && assumptions && weakness && control) {
                  let projectMilestoneObj = {
                    project: this.newDesign.project,
                    html: localStorage.getItem("newDesignHtml"),
                    threat: JSON.parse(localStorage.getItem("result")),
                    micro: this.newDesign.micro,
                    controlUnit: this.newDesign.controlUnit,
                    commLine: this.newDesign.commLine,
                    boundary: this.newDesign.boundary,
                    goal: this.goals,
                    assumptions: assumptions,
                    vulnerability: vulnerability,
                    otherNotifications,
                    riskNotifications,
                    control,
                    weakness
                  };
                  this.saveMilestone(projectMilestoneObj)
                }
            });
          }
        });
      // let threatListTemp = JSON.parse(localStorage.getItem("result"));
      // threatListTemp.forEach((threatItem, index) => {
      //   if (!threatItem.originalRiskScore) threatItem.originalRiskScore = threatItem.riskScore // if first time baseline, record the risk score as originalRiskScore
      // });
  }

  saveMilestone(projectMilestoneObj){
    this.posts = this._http.post(this.milestonesUrl + "/projectMilestoneDb", projectMilestoneObj);
    this.posts
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this._snackBar.open(res.msg, "", {
          duration: 3000,
        })
      });
  }
  loadMilestone() {
    if (this.newDesign.project.id) { // if the project has a name
      let queryParams = new HttpParams().set("projectId", this.newDesign.project.id);
      this._spinner.show();
      this._http
        .get(this.milestonesUrl + "/projectMilestoneDb", { params: queryParams })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          this._spinner.hide();
          if (res.length > 0) {
            const dialogRef = this.dialog.open(LoadMilestoneComponent, {
              // width: "500px",
              data: {
                milestones: res
              }
            });
            dialogRef.afterClosed()
              .pipe(takeUntil(this.unsubscribe))
              .subscribe(result => {
                if (result) {
                  const projectStatus = JSON.parse(localStorage.getItem("projectStatus"));
                  if (projectStatus !== null) {
                    const currentProjectIndex: number = projectStatus.findIndex(obj => obj.id === this.newDesign.project.id);
                    const currentProject = projectStatus[currentProjectIndex];
                    if (currentProjectIndex > -1) {
                      if (!currentProject.milestoneView) {
                        currentProject.milestoneView = true;
                      }
                      projectStatus[currentProjectIndex] = currentProject;
                      this.editDesignShared.projectStatus = currentProject;
                      localStorage.setItem("projectStatus", JSON.stringify(projectStatus));
                    } else {
                      const newProject = {
                        id: this.newDesign.project.id,
                        milestoneView: true
                      }
                      projectStatus.push(newProject);
                      this.editDesignShared.projectStatus = newProject;
                      localStorage.setItem("projectStatus", JSON.stringify(projectStatus));
                    }
                  } else {
                    const projectStatus = {
                      id: this.newDesign.project.id,
                      milestoneView: true
                    }

                    this.editDesignShared.projectStatus = projectStatus;

                    localStorage.setItem("projectStatus", JSON.stringify([projectStatus]));
                  }

                  this.newDesign.project = result.project;
                  this.newDesign.micro = result.micro;
                  this.newDesign.controlUnit = result.controlUnit;
                  this.newDesign.commLine = result.commLine;
                  this.newDesign.boundary = result.boundary;
                  this.cybersecurityGoalService.updateCybersecurityGoals(result.goal)
                  this.goals = result.goal;

                  this._resultShared.updateEntireResult(result.threat);

                  localStorage.setItem("newDesign", JSON.stringify(this.newDesign));
                  localStorage.setItem("newDesignHtml", result.html);
                  localStorage.setItem("result", JSON.stringify(result.threat));
                  localStorage.setItem("goal", JSON.stringify(result.goal));

                  if (this._router.url == "/modeling") {
                    this._compVisual.loadNewDesignHtml();
                  }

                  this._snackBar.open("Loaded milestone - " + result.project.milestoneName, "", {
                    duration: 3000,
                  });

                  location.reload();
                }
              });
          } else {
            this._snackBar.open(res.msg, "", { duration: 3000 });
          }
        });
    } else { // if the project doesn't have a name yet, not allowed to create
      // this.newDesign.project = this.editDesignShared.localProjectInfoFromLocalStorage(); // try local storage first
      // if (this.newDesign.project.id) { // try it again. if the project has a name
      //   let queryParams = new HttpParams().set("projectId", this.newDesign.project.id);
      //   this._http
      //     .get(this.milestonesUrl + "/projectMilestoneDb", { params: queryParams })
      //     .pipe(takeUntil(this.unsubscribe))
      //     .subscribe((res: any) => {
      //       if (res.length > 0) {
      //         const dialogRef = this.dialog.open(ShowMilestoneDialog, {
      //           // width: '700px',
      //           data: res,
      //         });
      //       } else {
      //         this._snackBar.open(res.msg, "", { duration: 3000 });
      //       }
      //     });
      // } else { // if still no project info, promp error
      //   this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
      //     duration: 5000,
      //   });
      // }

      this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
        duration: 5000,
      });
    }
  }
  switchToProject() {
    this._spinner.show();
    const projectStatus = JSON.parse(localStorage.getItem("projectStatus"));
    const currentProjectIndex: number = projectStatus.findIndex(obj => obj.id === this.newDesign.project.id);
    if (currentProjectIndex > -1) {
      const currentProject = projectStatus[currentProjectIndex];
      if (currentProject.milestoneView) {
        currentProject.milestoneView = false;
      }
      projectStatus[currentProjectIndex] = currentProject;
      this.editDesignShared.projectStatus = currentProject;
      localStorage.setItem("projectStatus", JSON.stringify(projectStatus));
    }
    let projectLoaded: boolean = false;
    let htmlLoaded: boolean = false;
    let resultLoaded: boolean = false;

    this._http
      .get(this.rootUrl + "/projectDb?id=" + this.newDesign.project.id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        projectLoaded = true;
        if (res) {
          localStorage.removeItem("newDesign");
          localStorage.setItem('newDesign', JSON.stringify(res));
        }
        if (resultLoaded && htmlLoaded) {
          //If viewing a vulnerability notification switch back to /vulnerabilities
          if(this.currentUrl.includes("vulnerabilities")){
            location.href = '/vulnerabilities'
          }else{
            location.reload();
          }
          this._spinner.hide();
          this._snackBar.open("Switched back to current project", "", {
            duration: 3000,
          });
        }
      });

    this._http
      .get(this.rootUrl + "/projectThreatListDb?id=" + this.newDesign.project.id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        resultLoaded = true;
        if (res) {
          localStorage.removeItem("result");
          localStorage.setItem('result', JSON.stringify(res));
        }
        if (htmlLoaded && projectLoaded) {
          if(this.currentUrl.includes("vulnerabilities")){
            location.href = '/vulnerabilities'
          }else{
            location.reload();
          }
          this._spinner.hide();
          this._snackBar.open("Switched back to current project", "", {
            duration: 3000,
          });
        }
      });

    this._http.get(this.rootUrl + "/cybersecurityGoals?id=" + this.newDesign.project.id).subscribe((res: any) => {
      if (res) {
        const goals: CybersecurityGoal[] = res ? res.goal : [];
        localStorage.setItem('goal', JSON.stringify(goals));
      }
    })

    this._http
      .get(this.rootUrl + "/projectHtmlDb?id=" + this.newDesign.project.id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        htmlLoaded = true;
        if (res) {
          localStorage.removeItem("newDesignHtml");
          localStorage.setItem("newDesignHtml", res);
        }
        if (projectLoaded && resultLoaded) {
          if(this.currentUrl.includes("vulnerabilities")){
            location.href = '/vulnerabilities'
          }else{
            location.reload();
          }
          this._spinner.hide();
          this._snackBar.open("Switched back to current project", "", {
            duration: 3000,
          });
        }
      });
  }
  showMilestone() {
    if (this.newDesign.project.id) { // if the project has a name
      let queryParams = new HttpParams().set("projectId", this.newDesign.project.id);
      this._http
        .get(this.milestonesUrl + "/projectMilestoneDb", { params: queryParams })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          if (res.length > 0) {
            const dialogRef = this.dialog.open(ShowMilestoneDialog, {
              // width: '700px',
              data: res,
            });
          } else {
            this._snackBar.open(res.msg, "", { duration: 3000 });
          }
        });
    } else { // if the project doesn't have a name yet, not allowed to create
      this.newDesign.project = this.editDesignShared.localProjectInfoFromLocalStorage(); // try local storage first
      if (this.newDesign.project.id) { // try it again. if the project has a name
        let queryParams = new HttpParams().set("projectId", this.newDesign.project.id);
        this._http
          .get(this.milestonesUrl + "/projectMilestoneDb", { params: queryParams })
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res: any) => {
            if (res.length > 0) {
              const dialogRef = this.dialog.open(ShowMilestoneDialog, {
                // width: '700px',
                data: res,
              });
            } else {
              this._snackBar.open(res.msg, "", { duration: 3000 });
            }
          });
      } else { // if still no project info, promp error
        this._snackBar.open("No project is active. Please create a new project or load an existing project", "Operation Failed.", {
          duration: 5000,
        });
      }
    }
  }
  deleteMilestone(msIndex) {

  }

  changePasswordView() {
    this.dialog.open(ChangePasswordDialog, {
      data: {
        _id: this.currentUserProfile._id,
        username: this.currentUserProfile.username,
      },
      width: '500px',
    });
  }

  validatePassword() {
    this._singleInputFormDialogService.open(this.verifyPasswordDialogOptions)
    this._singleInputFormDialogService
      .confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          const data = { username: this.currentUserProfile.username, password: confirmed }
          const headers = new HttpHeaders({ "Content-type": "application/json" });
          this._http.post(environment.backendApiUrl + "user" + "/login", data, { headers: headers }).subscribe((res: any) => {
            if (res.isAuth) {
              this._authService.passwordVerified = true;
              this._router.navigate(['/user-profile'])
            }
          })
        }
      })
  }

}
// Project Details popup Dialog
interface projectInfo {
  projectNotes: string;
  projectId: string;
  project: any
}
@Component({
  selector: 'navbar-component-dialog-projectinfo',
  templateUrl: './navbar.component.dialog.projectinfo.html',
  styleUrls: ['./navbar.component.css']
})
export class ProjectInfoDialog implements OnInit {
  project: ProjectType = {
    id: "",
    name: "",
  };
  public newDesign = new ComponentList(this.project, [], [], [], []);
  changeFields: projectInfo;
  selectedProjectId = this.data.projectData.project.id;
  createdTime = this.data.projectData.createdAt;
  updatedTime = this.data.projectData.updatedAt;
  lastSavedBy = this.data.projectData.project.lastModifiedBy;
  Notes = this.data.projectData.project.notes;
  currentUser = this.data.currentUser
  input: string;

  readonly rootUrl = environment.backendApiUrl + "projects";
  posts: any;
  currentRoute: string = this._router.url;
  constructor(private _router: Router, private _http: HttpClient, private editDesignShared: DesignSettingsService, private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProjectInfoDialog>, @Inject(MAT_DIALOG_DATA) public data: any) { }
  ngOnInit() {
    this.input = this.Notes;
  }
  notesAdded(notes: any) {
    this.changeFields = {
      projectNotes: notes,
      projectId: this.selectedProjectId,
      project: { id: this.selectedProjectId }
    }
    if (notes && notes.length > 0) {
      this._http
        .post(this.rootUrl + "/projectNotes", this.changeFields)
        .pipe(take(1))
        .subscribe((res: any) => {
          if (res && !this.Notes) {
            this._snackBar.open("Project notes added successfully", "Success", {
              duration: 5000,
            })
            this.editDesignShared.updateProjectProperty(notes, "notes");
          }
          if (res && this.Notes) {
            this._snackBar.open("Project notes updated successfully", "Success", {
              duration: 5000,
            })
            this.editDesignShared.updateProjectProperty(notes, "notes");
          }
        });
    }
    if (this.Notes && !notes) {
      this._http
        .post(this.rootUrl + "/projectNotes", this.changeFields)
        .pipe(take(1))
        .subscribe((res: any) => {
          if (res) {
            this._snackBar.open("Project notes deleted successfully", "Success", {
              duration: 5000,
            })
            this.editDesignShared.updateProjectProperty(notes, "notes");
          }
        })
    }

  }
  cancel() {
    this.dialogRef.close();
  }
}


// dialog to load a project
@Component({
  selector: 'navbar-component-dialog-load-project',
  templateUrl: './navbar.component.dialog.load.project.html',
  styleUrls: ['./navbar.component.css']
})
export class LoadProjectDialog {

  projectNameIndex: number;
  projectLoading: boolean;
  project: ProjectType = {
    id: "",
    name: "",
  };
  public newDesign = new ComponentList(this.project, [], [], [], []);
  selectedProjectId = this.dataLoadProjectInput.id[0];
  dataLoadProjects = this.dataLoadProjectInput.name;
  readonly rootUrl = environment.backendApiUrl + "projects";
  posts: any;
  currentUserProfile: UserProfile;
  private unsubscribe: Subject<void> = new Subject();

  constructor(private _ArrOp: ArrOpService, private domSanitizer: DomSanitizer, private editDesignShared: DesignSettingsService, private _authService: AuthenticationService,
    public dialogRef: MatDialogRef<LoadProjectDialog>, private _http: HttpClient, private router: Router, private _spinner: NgxSpinnerService, private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public dataLoadProjectInput: any) { }

  cancelLoadProject() {
    this.dialogRef.close();
    // this.editDesignShared.addToDesign
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe((designData) => this.newDesign = designData);
    // // console.log(`load project - current user id is ${this.newDesign.project.id}`);
    // if (this.newDesign.project.id) {
    //   this.dialogRef.close();
    // } else {
    //   this.dialogRef.close();
    //   location.reload();
    // }
  }

  // temporary code for backward compatibility - in case an old project doesn't have the featureRoleIndex stored with micro and controlUnit
  addFeatureRoleIndexProperty(newDesignObj) {
    newDesignObj.micro.forEach((currentComponent, currentComponentIndex) => {
      let featureRoleIndex = [];
      currentComponent.feature.forEach((currentFeature, currentFeatureIndex) => {
        let currentFeatureRoleIndex = this.editDesignShared.getFeatureRoleIndex(currentComponent.featureType[currentFeatureIndex], currentComponent.featureRole[currentFeatureIndex]);
        featureRoleIndex.push(currentFeatureRoleIndex);
      })
      currentComponent.featureRoleIndex = featureRoleIndex;
    })
    newDesignObj.controlUnit.forEach((currentComponent, currentComponentIndex) => {
      let featureRoleIndex = [];
      currentComponent.feature.forEach((currentFeature, currentFeatureIndex) => {
        let currentFeatureRoleIndex = this.editDesignShared.getFeatureRoleIndex(currentComponent.featureType[currentFeatureIndex], currentComponent.featureRole[currentFeatureIndex]);
        featureRoleIndex.push(currentFeatureRoleIndex);
      })
      currentComponent.featureRoleIndex = featureRoleIndex;
    })
    return newDesignObj
  }

  confirmLoadProject() {
    if (this.selectedProjectId) { // only proceed if a project is selected
      this.projectLoading = true;
      localStorage.removeItem("result");
      let queryParams = new HttpParams().set("id", this.selectedProjectId);

      const projectDb$ = this._http.get(this.rootUrl + "/projectDb", { params: queryParams });
      const projectHtmlDb$ = this._http.get(this.rootUrl + "/projectHtmlDb", { params: queryParams });
      const projectThreatListDb$ = this._http.get(this.rootUrl + "/projectThreatListDb", { params: queryParams }); // load result/threat list
      const cybersecurityGoals$ = this._http.get(this.rootUrl + "/cybersecurityGoals", { params: queryParams }); // load result/threat list
      const projectDeletedThreatListDb$ = this._http.get(this.rootUrl + "/projectDeletedThreatListDb", { params: queryParams });

      combineLatest([projectDb$, projectHtmlDb$, projectThreatListDb$, cybersecurityGoals$, projectDeletedThreatListDb$])
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(([projectDb, projectHtmlDb, projectThreatListDb, cybersecurityGoals, projectDeletedThreatListDb, projectControls]: any) => {
          let modifiedRes = this.addFeatureRoleIndexProperty(projectDb); // temporary code for backward compatibility
          localStorage.setItem('newDesign', JSON.stringify(modifiedRes));
          localStorage.setItem('newDesignHtml', JSON.stringify(projectHtmlDb).replace(/\\"/g, '"').slice(1, -1)); // get rid of escape characters. remove double quotes at beginning and end
          localStorage.setItem('result', JSON.stringify(projectThreatListDb));
          const goals: CybersecurityGoal[] = cybersecurityGoals ? cybersecurityGoals.goal : [];
          localStorage.setItem('goal', JSON.stringify(goals));
          if (projectDeletedThreatListDb && projectDeletedThreatListDb.threat) {
            modifiedRes.project.deletedThreatId = projectDeletedThreatListDb.threat.map((_: ThreatItem) => _.threatRuleEngineId);
            localStorage.setItem('newDesign', JSON.stringify(modifiedRes));
          } else {
            modifiedRes.project.deletedThreatId = [];
            localStorage.setItem('newDesign', JSON.stringify(modifiedRes));
          }
          this.dialogRef.close();
          location.reload();
        }, err => this.projectLoading = false)
    } else { // if no project is selected, do nothing

    }

  }

  @HostListener("keydown.esc")
  public onEsCancelLoadProject() {
    this.cancelLoadProject();
  }

  @HostListener("keydown.enter")
  public onEnterConfirmLoadProject() {
    this.confirmLoadProject();
  }

  selectProjectToLoad(i) {
    this.projectNameIndex = i;
    this.selectedProjectId = this.dataLoadProjectInput.id[i];
  }
}

// dialog to delete a project
@Component({
  selector: 'navbar-component-dialog-delete-project',
  templateUrl: './navbar.component.dialog.delete.project.html',
  styleUrls: ['./navbar.component.css']
})
export class DeleteProjectDialog {

  projectNameIndex: number;
  selectedProjectId;
  dataLoadProjects = this.dataLoadProjectInput.projectNameArray.name;
  readonly rootUrl = environment.backendApiUrl + "projects";
  posts: any;
  private unsubscribe: Subject<void> = new Subject();
  currentRoute: string = this._router.url;

  constructor(private _ArrOp: ArrOpService, private editDesignShared: DesignSettingsService,
    public dialogRef: MatDialogRef<DeleteProjectDialog>, private _http: HttpClient, private _router: Router,
    private _confirmDialogService: ConfirmDialogService, private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public dataLoadProjectInput: any) { }

  cancelDeleteProject() {
    this.dialogRef.close();
  }

  checkDeleteProject() {
    this.dialogRef.close(this.selectedProjectId);
  }

  @HostListener("keydown.esc")
  public onEsCancelDeleteProject() {
    this.cancelDeleteProject();
  }

  @HostListener("keydown.enter")
  public onEnterConfirmDeleteProject() {
    this.checkDeleteProject();
  }

  selectProjectToDelete(i) {
    this.projectNameIndex = i;
    this.selectedProjectId = this.dataLoadProjectInput.projectNameArray.id[i];
  }
}

// dialog to show milestone
@Component({
  selector: 'navbar-component-dialog-show-milestone',
  templateUrl: './navbar.component.dialog.show.milestone.html',
  styleUrls: ['./navbar.component.css']
})
export class ShowMilestoneDialog {

  availableMilestones: string[] = this.generateMilestoneList(this.milestoneDataInput);

  constructor(public dialogRef: MatDialogRef<ShowMilestoneDialog>, @Inject(MAT_DIALOG_DATA) public milestoneDataInput: any) { }

  closeMilestoneDialog() {
    this.dialogRef.close();
  }

  selectMilestone(index) {

  }

  @HostListener("keydown.esc")
  public onEsCloseMilestoneDialog() {
    this.closeMilestoneDialog();
  }

  generateMilestoneList(inputData) {
    let outputData = [];
    for (let i = 0; i < inputData.length; i++) {
      let date = new Date(inputData[i].createdAt);
      let entry = inputData[i].project.milestoneName + ", milestone created on: " + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ', ' + date.toLocaleTimeString() + " ";
      outputData.push(entry);
    }
    // console.log(outputData)
    return outputData
  }
}

// dialog to change user password
interface changePasswordFields {
  username: string;
  oldPassword: string;
  newPassword: string;
  cnewPassword: string;
  _id?: string;
}

@Component({
  selector: 'navbar-component-dialog-change-password',
  templateUrl: './navbar.component.dialog.change.password.html',
  styleUrls: ['./navbar.component.css']
})
export class ChangePasswordDialog {

  constructor(private fb: FormBuilder, private _router: Router, private _http: HttpClient,
    private _confirmDialogService: ConfirmDialogService, private _spinner: NgxSpinnerService,
    private _snackBar: MatSnackBar, private _authService: AuthenticationService, private _arrOp: ArrOpService,
    public dialogRef: MatDialogRef<ChangePasswordDialog>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  oldPassword = new FormControl('', Validators.required);
  newPassword = new FormControl('', Validators.required);
  cnewPassword = new FormControl('', Validators.required);

  updatePasswordForm = new FormGroup({
    'oldPassword': this.oldPassword,
    'newPassword': this.newPassword,
    'cnewPassword': this.cnewPassword,
  });

  changeFields: changePasswordFields[] = [];
  posts: any;
  message: string;
  readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";
  private unsubscribe: Subject<void> = new Subject();

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  changePassword() {
    if (this.updatePasswordForm.valid) {

      this.changeFields.push({
        username: this.data.username,
        oldPassword: this.updatePasswordForm.controls['oldPassword'].value,
        newPassword: this.updatePasswordForm.controls['newPassword'].value,
        cnewPassword: this.updatePasswordForm.controls['cnewPassword'].value,
        _id: this.data._id
      });

      this._http
        .post(this.secureduserRootUrl + "/changePassword", this.changeFields[0])
        .pipe(take(1))
        .subscribe((res: any) => {
          if (res.success) {
            this._snackBar.open(res.msg, "Success", {
              duration: 5000,
            })
          } else {
            this._snackBar.open(res.msg, "Failed", {
              duration: 5000,
            })
          }
        });
      this.dialogRef.close();
    }
  }
}

// FOR BROWSER NOT COMPATIBLE
@Component({
  selector: 'browser-not-compatible',
  templateUrl: './browser-not-compatible.html',
  styleUrls: ['./navbar.component.css']
})
export class NotCompatibleBrowserDialog {
  constructor(private dialog: MatDialog) { }

  closeDialog() {
    this.dialog.closeAll();
  }
}

