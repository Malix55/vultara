import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { map, startWith, shareReplay, tap, catchError, take, takeUntil } from 'rxjs/operators';
import { Observable, Observer, throwError } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HttpClient, HttpRequest, HttpParams, HttpHeaders } from '@angular/common/http';
import { UserProfile, AuthenticationService } from './../services/authentication.service';
import { Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css']
})
export class DashboardViewComponent implements OnInit {

  constructor(private _http: HttpClient, private breakpointObserver: BreakpointObserver, private _snackBar: MatSnackBar,
    private cdref: ChangeDetectorRef, private _authService: AuthenticationService ) { }

  project_cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
            { title: 'Threat Review Completion Rate', cols: 3, rows: 1 },
            { title: 'Risk Treatment Completion Rate', cols: 3, rows: 1 },
            { title: 'Threat Validation Completion Rate', cols: 3, rows: 1 },
            { title: 'Residual Risk', cols: 3, rows: 1 },
            { title: 'Vulnerability Distribution', cols: 3, rows: 1 },
            { title: 'Top 5 Weaknesses', cols: 3, rows: 1 },
            { title: 'Project Aggregated Risk', cols: 3, rows: 1 },
            { title: 'Cybersecurity Events and Incidents', cols: 3, rows: 1 }
        ];
      }

      return [
        { title: 'Threat Review Completion Rate', cols: 1, rows: 1 },
            { title: 'Risk Treatment Completion Rate', cols: 1, rows: 1 },
            { title: 'Threat Validation Completion Rate', cols: 1, rows: 1 },
            { title: 'Residual Risk', cols: 2, rows: 1 },
            { title: 'Vulnerability Distribution', cols: 1, rows: 1 },
            { title: 'Top 5 Weaknesses', cols: 1, rows: 1 },
            { title: 'Project Aggregated Risk', cols: 1, rows: 1 },
            { title: 'Cybersecurity Events and Incidents', cols: 1, rows: 1 }
        ];
    })
  );

  organization_cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
            { title: 'Residual Risk', cols: 3, rows: 1 },
            { title: 'Projects Managed', cols: 3, rows: 1 },
            { title: 'Organization Aggregated Risk', cols: 3, rows: 1 },
            { title: 'Cybersecurity Events and Incidents', cols: 3, rows: 1 },
            { title: 'Top 5 Threats', cols: 3, rows: 1 },
            { title: 'Vulnerability Distribution', cols: 3, rows: 1 },
            { title: 'Top 5 Weaknesses', cols: 3, rows: 1 }
        ];
      }

        return [
            { title: 'Residual Risk', cols: 2, rows: 1 },
            { title: 'Projects Managed', cols: 1, rows: 1 },
            { title: 'Organization Aggregated Risk', cols: 2, rows: 1 },
            { title: 'Cybersecurity Events and Incidents', cols: 1, rows: 1 },
            { title: 'Top 5 Threats', cols: 1, rows: 1 },
            { title: 'Vulnerability Distribution', cols: 1, rows: 1 },
            { title: 'Top 5 Weaknesses', cols: 1, rows: 1 }
        ];
    })
  );

  /* Data set inputs */
    projectCtrl: FormControl;
    filteredProjects: Observable<string[]>;
    projects: string[] = [];
    projectIds: string[] = [];
    allProjects: string[] = [];
    allProjectIds: string[] = [];
    multilineProjects: any[];
    currentUserProfile: UserProfile;
   
    readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";
    readonly dashboardRootUrl = environment.backendApiUrl + "dashboard";
    readonly projectRootUrl = environment.backendApiUrl + "projects";
    readonly vulnerabilitiesUrl = `${environment.backendApiUrl}vulnerability`;
    readonly riskUpdateNotificationsUrl = environment.backendApiUrl + "riskUpdate";
    private unsubscribe: Subject<void> = new Subject();
    posts: any;
    dataList: any;
    allDataList: any;

  threatReviewCompletionRate: any[] = [];
  riskTreatmentCompletionRate: any[] = [];
  threatValidationCompletionRate: any[] = [];
  residualRiskData: any[] = [];
  residualRiskDataForAllProjects: any[] = [];

  topFiveThreats: any[] = [];
  topFiveVulnerabilities: any[] = [];
  topFiveWeaknesses: any[] = [];
  topFiveWeaknessesForProject: any[] = [];
  allThreats: any[] = [];
  allVulnerabilities: any[] = [];
  allWeaknesses: any[] = [];
  allWeaknessesForProject: any[] = [];

  riskLevelChart: any[] = [];
  allRiskLevelChart: any = null;
  projectRiskLevelChart: any[] = [];
  allProjectRiskLevelChart: any[] = [];

  single_vulnerabilities: any[] = [];
  single_cybersecurityeventsandincidents: any[] = [];
  single_org_cybersecurityeventsandincidents: any[] = [];

  numberCardColorScheme = { domain: ['#ffffff', '#ffffff', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'] };
  managedbyColorScheme = { domain: ['#FFFFFF', '#FFA500', '#FFFF00', '#008000', '#a8385d', '#aae3f5'] };
  chartColorScheme = { domain: ['#FF0000', '#FF0066', '#FFA500', '#FFFF00', '#008000', '#AAE3F5'] };
  colorSchemeline = { domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'] };
  textColor: string = '#000000';
  customResidualRiskChartColors = [
    {
      name: '5',
      value: '#FF0000'
    },
    {
      name: '4',
      value: '#FFA500'
    },
    {
      name: '3',
      value: '#FFFF00'
    },
    {
      name: '2',
      value: '#00DB00'
    },
    {
      name: '1',
      value: '#005C00'
    }
  ];

   customVulnerabilityPieColors = [
    {
      name: 'CRITICAL',
      value: '#FF0000'
    },
    {
      name: 'HIGH',
      value: '#FFA500'
    },
    {
      name: 'MEDIUM',
      value: '#FFFF00'
    },
    {
      name: 'LOW',
      value: '#00DB00'
    },
    {
      name: 'NONE',
      value: '#005C00'
    }
  ];
    view: any[] = [375, 300];
    numbercard_view: any[] = [319, 280];

  xAxis: boolean = true;
  yAxis: boolean = true;
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  showYAxisLabelline: boolean = true;
  showXAxisLabelline: boolean = true;
  xAxisLabeline: string = 'Months';
  yAxisLabelline: string = 'Risk';
  showYAxisEventsLine = true;
  showXAxisEventsline = true;

  pageIndex: string = "";

  firstOrgRiskChart = 12;
  lastOrgRiskChart = 23;
  firstProjRiskChart = 12;
  lastProjectRiskChart = 23;

  selection: any;
  units: string = '  %  ';

  gradient: boolean = true;
  timeline: boolean = true;
  gradientbar = false;
  tooltipDisabled = false;
  /* End Data set inputs */

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  async ngOnInit() {
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => this.currentUserProfile = currentUser);

    this.projectCtrl = new FormControl();
    await this.onStart();
    if (this.currentUserProfile.role == 'Admin' || this.currentUserProfile.role == 'Super Admin' || this.currentUserProfile.role == 'Security Manager') {
      this.pageIndex = '0';
    } else {
      this.pageIndex = '1';
    }

  }

  async onStart() {
    await this.getProjects();
    this.selection = this.projects[0];
    this.projectCtrl.setValue(this.projects[0]);
    this.filteredProjects = this.projectCtrl.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterStates(state) : this.projects.slice())
      );
    await this.getProjectChartData();
    if (this.currentUserProfile.role == 'Admin' || this.currentUserProfile.role == 'Super Admin' || this.currentUserProfile.role == 'Security Manager') {
      await this.getOrganizationChartData();
    }
  }



  async getProjects() {
    this.projects = [];
    this.projectIds = [];
    return new Promise((resolve, reject) => { // get projects
      let queryParams = new HttpParams().set("_id", this.currentUserProfile._id);
      this._http
        .get(this.projectRootUrl + "/getAllProjectIdsOfUser", { params: queryParams })
        .toPromise()
        .then((res: any) => {
          if (res.id.length > 0) {
            this.projects = [...this.projects, ...res.name]
            this.projectIds = [...this.projectIds, ...res.id]
          }
          resolve(this.projectIds);
        })
        .catch(e => {
          //console.log(e);
          reject(e)
        })
    });
  }
  getProjectChartData() {
    this.threatReviewCompletionRate = [];
    this.riskTreatmentCompletionRate = [];
    this.threatValidationCompletionRate = [];
    this.single_vulnerabilities = [];
    this.single_cybersecurityeventsandincidents = [];
    this.residualRiskData = [];
    this.topFiveWeaknessesForProject = [];
    this.allProjectRiskLevelChart = [];
    this.projectRiskLevelChart = [];

    let index = this.projects.indexOf(this.selection);
    let queryParams = new HttpParams().set("id", this.projectIds[index]);
    this._http
      .get(this.dashboardRootUrl + "/getProjectThreatReviewCompletionRate", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.threatReviewCompletionRate = res;
        //console.log(this.threatReviewCompletionRate);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectRiskTreatmentCompletionRate", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.riskTreatmentCompletionRate = res;
        //console.log(this.riskTreatmentCompletionRate);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectThreatValidationCompletionRate", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.threatValidationCompletionRate = res;
        //console.log(this.threatValidationCompletionRate);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectVulnerabilities", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (res.length) {
          const data = res.map(function (row) {
            return { name: row._id, value: row.count }
          })
          let sortedSeverity = []
          //Sort severities in array from CRITICAL to NONE
          data.map(item => {
            if(item.name == "CRITICAL"){
              sortedSeverity[0] = item;
            }
            if(item.name == "HIGH"){
              sortedSeverity[1] = item;
            }
            if(item.name == "MEDIUM"){
              sortedSeverity[2] = item;
            }
            if(item.name == "LOW"){
              sortedSeverity[3] = item;
            }
            if(item.name == "NONE"){
              sortedSeverity[4] = item;
            }
          })
          sortedSeverity = sortedSeverity.filter(Boolean);
          this.single_vulnerabilities = sortedSeverity;
        } else {
          this.single_vulnerabilities = [{ name: "Vulnerabilities", value: 0 }];
        }
        // console.log(this.single_vulnerabilities);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectCyberSecurityEventsAndIncidents", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.single_cybersecurityeventsandincidents = res;
        //console.log(this.single_cybersecurityeventsandincidents);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectResidualRiskData", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.residualRiskData = res;
        //console.log(this.residualRiskData);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectTopFiveWeaknesses", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.topFiveWeaknessesForProject = res;
        //console.log(this.topFiveWeaknessesForProject);
      });

    this._http
      .get(this.dashboardRootUrl + "/getProjectRiskLevelChart", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.allProjectRiskLevelChart = res;
        this.projectRiskLevelChart = [
          {
            name: "Months",
            series: []
          }
        ];
        this.projectRiskLevelChart[0].name = this.allProjectRiskLevelChart[0].name;
        let j = 0;
        for (let i = this.firstProjRiskChart; i <= this.lastProjectRiskChart; i++) {
          this.projectRiskLevelChart[0].series[j] = this.allProjectRiskLevelChart[0].series[i];
          j++;
        }
        //console.log(this.projectRiskLevelChart);
      });
  }

  getOrganizationChartData() {
    this.single_org_cybersecurityeventsandincidents = [];
    this.residualRiskDataForAllProjects = [];
    this.topFiveThreats = [];
    this.topFiveVulnerabilities = [];
    this.topFiveWeaknesses = [];
    this.allRiskLevelChart = null;
    this.riskLevelChart = [];

    let queryParams = new HttpParams();
    queryParams = queryParams.append('idList', this.projectIds.join(', '));
    this._http
      .get(this.dashboardRootUrl + "/getCyberSecurityEventsAndIncidents", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.single_org_cybersecurityeventsandincidents = res;
        //console.log(this.single_org_cybersecurityeventsandincidents);
      });
    this._http
      .get(this.dashboardRootUrl + "/getResidualRiskData", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.residualRiskDataForAllProjects = res;
        //console.log(this.residualRiskDataForAllProjects);
      });
    this._http
      .get(this.dashboardRootUrl + "/getTopFiveThreats", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.topFiveThreats = res;
        // console.log(this.topFiveThreats);
      });
    this._http
      .get(this.dashboardRootUrl + "/getTopFiveVulnerabilities", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if(res.length) {
          const data = res.map(function (row) {
            return { name: row._id, value: row.count }
          })
          let sortedSeverity = []
          //Sort severities in array from CRITICAL to NONE
          data.map(item => {
            if(item.name == "CRITICAL"){
              sortedSeverity[0] = item;
            }
            if(item.name == "HIGH"){
              sortedSeverity[1] = item;
            }
            if(item.name == "MEDIUM"){
              sortedSeverity[2] = item;
            }
            if(item.name == "LOW"){
              sortedSeverity[3] = item;
            }
            if(item.name == "NONE"){
              sortedSeverity[4] = item;
            }
          })
          sortedSeverity = sortedSeverity.filter( Boolean );
          this.topFiveVulnerabilities = sortedSeverity;
        //console.log(this.topFiveVulnerabilities);
        }
      });
    this._http
      .get(this.dashboardRootUrl + "/getTopFiveWeaknesses", { params: queryParams })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.topFiveWeaknesses = res;
        //console.log(this.topFiveWeaknesses);
      });
    this._http
      .get(this.dashboardRootUrl + "/getRiskLevelChart")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (res) {
          this.allRiskLevelChart = res;
          this.riskLevelChart = [
            {
              name: "Months",
              series: []
            }
          ];
          this.riskLevelChart[0].name = this.allRiskLevelChart.name;
          let j = 0;
          for (let i = this.firstOrgRiskChart; i <= this.lastOrgRiskChart; i++) {
            this.riskLevelChart[0].series[j] = this.allRiskLevelChart.series[i];
            j++;
          }
        }
      });

  }

  /* This is needed to fix ExpressionChangedAfterItHasBeenCheckedError */
  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }
  /* End This is needed to fix ExpressionChangedAfterItHasBeenCheckedError*/

  filterStates(name: string) {
    return this.projects.filter(project =>
      project.toLowerCase().includes(name.toLowerCase()));
  }

  loadPreviousOrgRiskScoreData() {
    if (this.firstOrgRiskChart > 0) {
      this.firstOrgRiskChart--;
      this.lastOrgRiskChart--;
    }
    this.riskLevelChart = [
      {
        name: "Months",
        series: []
      }
    ];
    this.riskLevelChart[0].name = this.allRiskLevelChart.name;
    let j = 0;
    for (let i = this.firstOrgRiskChart; i <= this.lastOrgRiskChart; i++) {
      this.riskLevelChart[0].series[j] = this.allRiskLevelChart.series[i];
      j++;
    }
  }

  loadMoreOrgRiskScoreData() {
    if (this.lastOrgRiskChart < 23) {
      this.firstOrgRiskChart++;
      this.lastOrgRiskChart++;
    }
    this.riskLevelChart = [
      {
        name: "Months",
        series: []
      }
    ];
    this.riskLevelChart[0].name = this.allRiskLevelChart.name;
    let j = 0;
    for (let i = this.firstOrgRiskChart; i <= this.lastOrgRiskChart; i++) {
      this.riskLevelChart[0].series[j] = this.allRiskLevelChart.series[i];
      j++;
    }
  }

  loadPreviousProjRiskScoreData() {
    if (this.firstProjRiskChart > 0) {
      this.firstProjRiskChart--;
      this.lastProjectRiskChart--;
    }
    this.projectRiskLevelChart = [
      {
        name: "Months",
        series: []
      }
    ];
    this.projectRiskLevelChart[0].name = this.allProjectRiskLevelChart[0].name;
    let j = 0;
    for (let i = this.firstProjRiskChart; i <= this.lastProjectRiskChart; i++) {
      this.projectRiskLevelChart[0].series[j] = this.allProjectRiskLevelChart[0].series[i];
      j++;
    }
  }

  loadMoreProjRiskScoreData() {
    if (this.lastProjectRiskChart < 23) {
      this.firstProjRiskChart++;
      this.lastProjectRiskChart++;
    }
    this.projectRiskLevelChart = [
      {
        name: "Months",
        series: []
      }
    ];
    this.projectRiskLevelChart[0].name = this.allProjectRiskLevelChart[0].name;
    let j = 0;
    for (let i = this.firstProjRiskChart; i <= this.lastProjectRiskChart; i++) {
      this.projectRiskLevelChart[0].series[j] = this.allProjectRiskLevelChart[0].series[i];
      j++;
    }
  }

  onEnter(project: string) {
    this.selection = project;
    this.getProjectChartData();
  }

  onChange(index) {
    this.pageIndex = index;
  }
}
