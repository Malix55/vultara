import { Wp29ThreatService } from './../services/wp29-threat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ArrOpService } from './../services/arr-op.service';
import { ConfirmDialogService } from './../services/confirm-dialog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResultSharingService } from './../services/result-sharing.service';
import { ComponentMicro, ComponentControlUnit, ComponentCommLine, ComponentList, ComponentBoundary, ProjectType, ThreatItem, ValueAndViewValue, mitreAttackIndexInterface, CybersecurityGoal, TacticInterface } from '../../threatmodel/ItemDefinition';
import { Component, OnInit, ViewChild, ChangeDetectorRef, NgZone, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { DesignSettingsService } from '../services/design-settings.service';
import { Subject, timer } from 'rxjs';
import { takeUntil, take, debounceTime } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserProfile, AuthenticationService } from './../services/authentication.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { environment } from 'src/environments/environment';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import * as moment from "moment";
import { MatDialog } from '@angular/material/dialog';
import { DeleteThreatComponent } from '../dialogues/delete-threat/delete-threat.component';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MitreAttackService } from '../services/mitre-attack.service';
import { RiskUpdateComponent } from '../dialogues/risk-update/risk-update.component';
import { CybersecurityGoalService } from '../services/cybersecurity-goal.service';
import { FilterGoalsComponent } from '../dialogues/filter-goals/filter-goals.component';
import { FeasibilityTotalPipe } from '../pipes/feasibility-total';
import { ThreatHistoryComponent } from '../dialogues/threat-history/threat-history.component';

export enum TreatmentType {
  NoTreatment = 'no treatment'
}

export enum FeasibilityValue {
  Numeric = "Numeric",
  Enumerate = "Enumerate"
}

export enum ControlThreatContainer {
  Before = "mitreBeforeControl",
  After = "mitreAfterControl"
}

export enum ThreatListViewType {
  All,
  Highlighted,
  Reviewed,
  NotReviewed,
  Validated,
  NotValidated,
  FilterByGoals,
  EnableItemBoundary,
  SearchResult
}

export enum SortActiveColumnName {
  RiskLevel = 'riskLevel'
}

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
  // providers: [
  //   { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { clickAction: 'noop' } as MatCheckboxDefaultOptions },
  // ],
})
export class TableViewComponent implements OnInit, AfterViewInit {
  public TreatmentType = TreatmentType;
  public FeasibilityValue = FeasibilityValue;
  public project: ProjectType = { id: "" };
  // public newDesign = new ComponentList(this.project, [], [], [], []);
  public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  // newDesign is the list of all components to document what's on the canvas
  public newDesign = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);
  resultShared: ThreatItem[] = [];
  // reviewedResult: ThreatItem[] = []; // store reviewed threats, and keep these threats in case of re-running the modeling
  displayedColumns: string[] = ['rowNumber', 'asset', 'securityPropertyCia', 'threatScenario', 'attackPath', 'damageScenario', 'impact',
    'attackFeasibility', 'riskLevel', 'riskTreatment', 'reviewed', 'treatmentVal', 'tableOp'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  posts: any;

  impactLevelName = [];  // will read from configuration data
  impactAggMethod = ""; // will read from configuration data
  feasibilityLevelName = [];  // will read from configuration data
  feasibilityMethod = ""; // will read from configuration data
  feasibilityRating = [];  // will read from configuration data
  feasibilityValue: string = "Numeric"; // will read feasibulity value type (Numeric/Enumerate)
  feasibilityRatingAP: number[] = []; // will read from configuration data
  riskMatrixName = ""; // will read from configuration data. can be symmetric, asymmetric, or lowRisk
  // call risk level by symmetricRiskMatrix[ind_1][ind_2]. ind_1 impact, ind_2 feasibility. [high to low] is [0 to 3]
  // symmetricRiskMatrix = [[5, 4, 3, 1], [4, 3, 2, 1], [3, 2, 2, 1], [1, 1, 1, 1]];
  // asymmetricRiskMatrix = [[5, 4, 3, 2], [4, 3, 3, 2], [3, 2, 2, 2], [2, 1, 1, 1]];
  // lowRiskProfileRiskMatrix = [[3, 3, 2, 1], [3, 2, 2, 1], [2, 2, 1, 1], [1, 1, 1, 1]];
  riskMatrix = [];
  securityPropertyName = ["c", "i", "a"];
  threatSourceName: ValueAndViewValue[] = [ // for display
    { value: "wp29RuleEngine", viewValue: "WP29 Engine" },
    { value: "ruleEngine", viewValue: "Rule Engine" },
    { value: "userManual", viewValue: "User Manually Added" },
    { value: "userAddedThreatLib", viewValue: "User Threat Library" },
    // {value: "dataEngine", viewValue: "Data Engine"},
  ];
  showHighlighted = false;
  treatments = ["no treatment", "reduce", "retain", "avoid", "share"];
  boundaryFilteredResult = [];
  boundaryBtnDisplay = "Enable Item Boundary";
  featureList = {
    id: [],
    name: [],
  };
  componentNickNameList = {
    id: [],
    name: [],
  }
  updatedRiskFeasibility = {
    ElapsedTime: 0,
    Expertise: 0,
    Knowledge: 0,
    Window: 0,
    Equipment: 0,
  }
  private unsubscribe: Subject<void> = new Subject();
  private filteredValueStream: Subject<string> = new Subject();
  confirmToEnableBoundaryeDialogOptions = {
    title: "ENABLE BOUNDARY",
    message: "Enabling the boundary will remove all threats to components outside the boundary. " +
      "If you did not use a boundary, or the boundary was not activated in your model, this operation will remove all threats. " +
      "This operation is not reversable. Are you sure you want to proceed?",
    cancelText: "Cancel",
    confirmText: "Confirm"
  };
  confirmToUncheckReviewedDialogOptions = {
    title: "UNDO REVIEW STATUS",
    message: "Are you sure you want to unfreeze this threat by removing the reviewed status?",
    cancelText: "Cancel",
    confirmText: "Confirm"
  };
  confirmToUncheckValidateDialogOptions = {
    title: "UNDO VALIDATION STATUS",
    message: "Are you sure you want to change the validation status?",
    cancelText: "Cancel",
    confirmText: "Confirm"
  };
  confirmToChangeThreatSourceToNonRuleEngineDialogOptions = {
    title: "CHANGE THREAT SOURCE TO NON-RULE-ENGINE",
    message: "Are you sure you want to change threat source? Once confirmed, this action is irreversible.",
    cancelText: "Cancel",
    confirmText: "Confirm"
  };
  currentUserProfile: UserProfile = this._authService.currentUserValue();
  feasibilityRatingAPRubrics: any;
  wp29AttackIndexes: any[] = [];
  mitreAttackMethod: any;
  threatRuleEngineId: any;
  notificationType: string;
  readonly riskUpdateNotificationsUrl = environment.backendApiUrl + "riskUpdate";
  readonly secureduserRootUrl = environment.backendApiUrl + "secureduser";
  readonly systemConfigRootUrl = environment.backendApiUrl + "config";
  readonly mitreAttackRootUrl = environment.backendApiUrl + "mitreattack";
  readonly projectRootUrl = environment.backendApiUrl + "projects";
  readonly alwaysTrue = true;
  private threatListViewType = ThreatListViewType.All;
  private updatePagination: boolean = true; // Check whether pagination should be applied or not
  public openedMitreAttack: boolean = false;
  public mergedThreat: ThreatItem;
  public toggleMergedThreatChanges: boolean = false;
  public goals: CybersecurityGoal[] = [];
  public ControlThreatContainer = ControlThreatContainer;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public pageSize: number = 10;
  public totalRows: number = 0;
  public currentPage: number = 0;
  public pageSizeOptions: number[] = [10, 20, 50];
  readonly rootUrl = environment.backendApiUrl + "projects";


  constructor(private _resultShared: ResultSharingService, private _editDesignShared: DesignSettingsService, public dialog: MatDialog,
    private _cdRef: ChangeDetectorRef, private _router: Router, private _confirmDialogService: ConfirmDialogService,
    private _spinner: NgxSpinnerService, private _authService: AuthenticationService, private _ArrOp: ArrOpService,
    private _http: HttpClient, private _snackBar: MatSnackBar, public wp29ThreatService: Wp29ThreatService, private activatedRoute: ActivatedRoute,
    public mitreAttackService: MitreAttackService, private cybersecurityGoalService: CybersecurityGoalService, private feasibilityTotalPipe: FeasibilityTotalPipe,
    private ngZone: NgZone
  ) { }

  @ViewChild("autosize") autosize: CdkTextareaAutosize; // textarea autosizing

  ngOnInit(): void {
    this._editDesignShared.addToDesign
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((designData) => this.newDesign = designData);
    if (this.newDesign.commLine.length == 0) {
      this._editDesignShared.loadLocalStorage(this.microList, this.controlUnitList, this.lineList, this.boundaryList); // load newDesign from localStorage
      this._editDesignShared.addToDesign
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((designData) => this.newDesign = designData);
      // this.newDesign = JSON.parse(localStorage.getItem('newDesign'));
    };
    this.updateFeatureList(this.newDesign); // update the feature list, for selections in the table
    if (localStorage.getItem("newDesign")) { // if localStorage exists, load the project name
      this.project = this._editDesignShared.localProjectInfoFromLocalStorage();
      // console.log(this.project);
    };
    this._resultShared.resultSharedObs
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resultData: any) => {
        if (resultData && resultData.length > 0) {
          resultData = resultData.map(obj => {
            if (obj.highlight === '_riskUpdate') {
              delete obj.highlight;
            }
            return obj;
          });
          this.resultShared = resultData;
          if (this.dataSource && this.updatePagination) {
            this.setPaginationForThreats(resultData);
          }
          this.updatePagination = true;
          this._cdRef.detectChanges();
          if (this.notificationType && this.notificationType === "riskUpdate") {
            this.setRiskUpdateByThreatRuleEngineId(resultData, this.threatRuleEngineId);
          }
        }
      });

    if (!this._resultShared.resultUpdated) {
      this._resultShared.loadLocalStorage();
    }

    // read system configuration data
    this._http
      .get(this.systemConfigRootUrl + "/systemconfig")
      .pipe(take(1))
      .subscribe((res: any) => {
        this.mitreAttackMethod = res.mitreAttackMethod;
        this.impactAggMethod = res.impactAggMethod;
        this.riskMatrixName = res.riskMethod;
        this.impactLevelName = res.impactLevelName;
        this.feasibilityLevelName = res.feasibilityLevelName;
        let riskMatrixName = res.riskMethod;
        let riskMatrixNameIndex = res.riskMethodMapping.indexOf(riskMatrixName);
        this.riskMatrix = res.riskMatrix[riskMatrixNameIndex];
        this.feasibilityMethod = res.feasibilityMethod;
        this.feasibilityRatingAPRubrics = res.feasibilityRatingAPRubrics;
        this.feasibilityValue = res.feasibilityValue;
        this.feasibilityRatingAP = res.feasibilityRatingAP;
        switch (res.feasibilityMethod) {
          case "Attack Potential":
            this.feasibilityRating = res.feasibilityRatingAP;
            break;
          case "CVSS":
            this.feasibilityRating = res.feasibilityRatingCVSS;
            break;
          case "Attack Vector":
            this.feasibilityRating = res.feasibilityRatingAV[1];
            break;
        };
        // merge threat feature is disabled. so this following is commented out
        // this.mitreAttackService.setAtmTactics();
        this._cdRef.detectChanges();
      });
    this.initCybersecurityGoals();

    this.filteredValueStream.pipe(debounceTime(1000)).pipe(takeUntil(this.unsubscribe)).subscribe((filterText: string) => this.filterThreatListByInput(filterText));
  }

  ngAfterViewInit() {
    // merge threat feature is disabled. so these following are commented out
    // this.getMitreAttackTacticDataFromDb();
    // this.mergeAttackThreatSubscription();
    // this.mergeControlThreatSubscription();
    this.setPaginationForThreats(this.resultShared);
    this.dataSource.filterPredicate = (data: ThreatItem, filter: string) => {
      //Default dataSource table filter
      const dataString = Object.keys(data)
        .reduce((currentTerm: string, key: string) => {
          return currentTerm + (data as { [key: string]: any })[key] + '◬';
        }, '')
        .toLowerCase();
      const transformedFilter = filter.trim().toLowerCase();
      return dataString.indexOf(transformedFilter) != -1;
    }
    this._cdRef.detectChanges();
    const spinnerSource = timer(10);
    spinnerSource.pipe(takeUntil(this.unsubscribe)).subscribe(res => {
      this._spinner.hide();
    });
    this.riskUpdatePopup();
    this.getWP29AttackThreatInfo();
    localStorage.setItem("intendedUrl", this._router.url);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Sort and update threat list pagination when table column sort event is triggered. 
  sortValueChanges($event: any) {
    this.setPaginationForThreats(this.resultShared);
  }

  // Material dataSource load only the user requested threats. The function is responsible for the threat list pagination. Also, it sorts the threat list according to user action. 
  private setPaginationForThreats(data: ThreatItem[] = []) {
    const direction: string = this.sort.direction;
    const level: string = this.sort.active;
    if (direction) {
      switch (level) {
        case SortActiveColumnName.RiskLevel:
          data = data.sort((a: ThreatItem, b: ThreatItem) => {
            if (direction === "asc") {
              return Number(a.riskLevel) - Number(b.riskLevel);
            } else {
              return Number(b.riskLevel) - Number(a.riskLevel);
            }
          });
          break;

        default:
          break;
      }
    }
    this.totalRows = data.length;
    const initialIndex: number = this.currentPage * this.pageSize;
    const lastIndex: number = initialIndex + this.pageSize;
    this._spinner.show();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.dataSource.data = data.slice(initialIndex, lastIndex > this.totalRows ? this.totalRows : lastIndex);
          this._spinner.hide();
        });
      }, 50);
    });
  }

  // Apply pagination when the threat list page is changed from paginator button click
  pageChanged(event: PageEvent) {
    this.totalRows = event.length;
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.setPaginationForThreats(this.resultShared);
  }

  // Filter threat list by selected goals from the pop-up.
  public filterThreatListByGoals() {
    const dialogRef = this.dialog.open(FilterGoalsComponent, {
      width: "900px",
      height: "50vh",
      panelClass: 'cybersecurity-dialog-container',
      data: {
        goals: this.goals
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((goals: CybersecurityGoal[]) => {
        if (goals) {
          this.threatListViewType = ThreatListViewType.FilterByGoals;
          const threats: ThreatItem[] = this._resultShared.getAllThreatsFromBackup() ? this._resultShared.getAllThreatsFromBackup() : [];
          let threatIds: string[] = [];
          goals.forEach((goal: CybersecurityGoal) => {
            threatIds = [...threatIds, ...goal.threatId];
          });
          const filteredThreatIds: any[] = threats.filter((threat: ThreatItem) => threatIds.includes(threat.id)).map((threat: ThreatItem) => threat.id);
          const idKeys: string[] = filteredThreatIds.map((id: string) => "id");
          this.currentPage = 0;
          if (idKeys.length > 0 && filteredThreatIds.length > 0 && idKeys.length === filteredThreatIds.length) {
            this.applyFiltersForThreats(idKeys, filteredThreatIds);
          } else {
            this.resultShared = [];
            this.currentPage = 0;
            this.setPaginationForThreats(this.resultShared);
          }
        }
      });
  }

  private initCybersecurityGoals() {
    let params = new HttpParams().set("id", this.project.id); 
    this.cybersecurityGoalService.cybersecurityGoal$.pipe(takeUntil(this.unsubscribe)).subscribe((_: CybersecurityGoal[]) => {
      if (_) {
        this.goals = _;
      }
    });

    if(this._editDesignShared.projectStatus?.milestoneView==true){
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("control", "true").set("id",this.newDesign.project.id);
      this._http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        if(res){
          let allData = [...this.goals,...res.control]
          let data:any =  allData.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i)
          this.cybersecurityGoalService.updateCybersecurityGoals(data)
        }
      })
    }else{
      const $controls = this._http.get<any>(this.rootUrl + "/projectControl", { params }).subscribe(res=>{
        if(res){
          let allData = [...this.goals,...res]
          let data:any =  allData.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i)
          this.cybersecurityGoalService.updateCybersecurityGoals(data)
        }
      });
    }
  }

  // Get subscription from tactic column threats merging
  private mergeAttackThreatSubscription() {
    this.mitreAttackService.mergeAttackThreatStream.pipe(takeUntil(this.unsubscribe)).subscribe((value: any) => {
      if (value) {
        this.updateRemovedAfterMerge(value);
        this.updateAtomicThreats(value);
        this.updateMergedThreats(value);
        this._cdRef.detectChanges();
      }
    })
  }

  // Update/delete threat from table according to user selection in control bottom sidepanel pop-up
  private updateExistingThreatsFromControlStatus(threats: ThreatItem[], controlThreat: ThreatItem, status: string) {
    const deletedThreatIndex: number = threats.findIndex((_: ThreatItem) => _.id === controlThreat.id && _.threatRowNumber === controlThreat.threatRowNumber);
    switch (status) {
      case "permanentDelete":
        if (deletedThreatIndex > -1) {
          threats.splice(deletedThreatIndex, 1);
          this.setPaginationForThreats(threats);
          this._resultShared.updateEntireResult(threats);
        }
        break;
      case "temporaryDelete":
        if (deletedThreatIndex > -1) {
          threats[deletedThreatIndex].hidden = true;
          this.deleteThreatTemporarily(threats[deletedThreatIndex]);
        }
        break;

      default:
        break;
    }
  }

  // Insert new threat to table from before & after "Control" threat's merging
  private insertMitreControlThreat(threats: ThreatItem[] = [], mergedThreat: ThreatItem) {
    const threatRowNumber: number = threats.length > 0 ? threats[threats.length - 1].threatRowNumber + 1 : 1;
    const threat: ThreatItem = {
      ...mergedThreat,
      threatRowNumber
    };

    if (threat.reviewedDateTime) {
      delete threat.reviewedDateTime;
    }

    if (threat.reviewStatusRevokedBy) {
      delete threat.reviewStatusRevokedBy;
    }

    const threatKeys: string[] = this.getKeysWithUpdatedIncluded(threat);
    threatKeys.forEach((_: string) => {
      delete threat[_];
    });

    threats.push(threat);
    this.setPaginationForThreats(threats);
    this._resultShared.updateEntireResult(threats);
    this._cdRef.detectChanges();
  }

  // Get threat properties name with included "Updated"
  private getKeysWithUpdatedIncluded(threat: ThreatItem) {
    const threatKeys: string[] = Object.keys(threat);
    return threatKeys.filter((_: string) => _.includes("Updated"));
  }

  // Get subscription from control threats merging
  private mergeControlThreatSubscription() {
    this.mitreAttackService.mergeControlThreatStream.pipe(takeUntil(this.unsubscribe)).subscribe((value: any) => {
      if (value) {
        this.updateExistingThreatsFromControlStatus(this.resultShared, this.mitreAttackService.mitreControlBeforeThreat, value.beforeThreatStatus);
        this.updateExistingThreatsFromControlStatus(this.resultShared, this.mitreAttackService.mitreControlAfterThreat, value.afterThreatStatus);

        this.insertMitreControlThreat(this.resultShared, value.mergedThreat);

        this.mitreAttackService.resetControlThreats();
      }
    })
  }

  // Update removedAfterMerge property of threat after merge threat is done
  private updateRemovedAfterMerge(value: any) {
    if (value.mergedThreat) {
      const removedAfterMerge: string[] = this.mitreAttackService.removedAfterMerge;
      if (removedAfterMerge && removedAfterMerge.length > 0) {
        removedAfterMerge.forEach(_ => {
          const index: number = this.resultShared.findIndex((__: ThreatItem) => __.id === _);
          if (index > -1) {
            this.resultShared[index].mitreAttackIndex.removedAfterMerge.push(true);
          }
        });
        this.setPaginationForThreats(this.resultShared);
        this._resultShared.updateEntireResult(this.resultShared);
        this.mitreAttackService.removedAfterMerge = [];
      }
    }
  }

  // Add merged threat to table view as new threat
  private updateMergedThreats(value: any) {
    if (value.mergedThreat) {
      const selectedThreatIndex: number = this.resultShared.findIndex((_: ThreatItem) => _.id === value.mergedThreat.id &&
        _.threatRowNumber === value.mergedThreat.threatRowNumber);

      if (selectedThreatIndex > -1) {
        value.threat = {
          ...value.threat,
          threatRowNumber: value.mergedThreat.threatRowNumber,
          id: value.mergedThreat.id
        }

        this.resultShared[selectedThreatIndex] = value.threat;
      }
    } else {
      this.resultShared.push(value.threat);
    }
    this.setPaginationForThreats(this.resultShared);
    this._resultShared.updateEntireResult(this.resultShared);
  }

  // Update atomic threats information after merge action is done
  private updateAtomicThreats(value: any) {
    const tacticsThreats: ThreatItem[] = value.tacticsThreats;
    const data: ThreatItem[] = this.resultShared;
    tacticsThreats.forEach((_: ThreatItem) => {
      const index: number = data.findIndex(__ => __.threatRowNumber === _.threatRowNumber && __.id === _.id);
      if (index > -1) {
        let mitreAttackIndex: mitreAttackIndexInterface = data[index].mitreAttackIndex;
        if (typeof data[index].mitreAttackIndex === "undefined") {
          mitreAttackIndex = this.mitreAttackService.getDefaultMitreAttackIndex(value.threat.mitreAttackIndex.matrix, false);
        }

        mitreAttackIndex = {
          ...mitreAttackIndex,
          mergedThreatId: [...mitreAttackIndex.mergedThreatId, _.mitreAttackIndex.mergedThreatId[0]],
          tacticVId: [...mitreAttackIndex.tacticVId, _.mitreAttackIndex.tacticVId[0]],
          techniqueVId: [...mitreAttackIndex.techniqueVId, _.mitreAttackIndex.techniqueVId[0]],
          subTechniqueVId: [...mitreAttackIndex.subTechniqueVId, _.mitreAttackIndex.subTechniqueVId[0]],
          removedAfterMerge: [...mitreAttackIndex.removedAfterMerge, _.mitreAttackIndex.removedAfterMerge[0]]
        }

        data[index] = {
          ...data[index],
          mitreAttackIndex
        }

        if (value.hideUsedThreats) {
          data[index].hidden = true;
          this.deleteThreatTemporarily(data[index]);
        }
      }
    });

    this.setPaginationForThreats(data);
    this._resultShared.updateEntireResult(this.resultShared);
  }

  // Get tactic/technique information from mitreAttackDb
  private getMitreAttackTacticDataFromDb() {
    this._http
      .get(this.mitreAttackRootUrl)
      .pipe(take(1))
      .subscribe((res: TacticInterface[]) => {
        if (res && res.length > 0) {
          this.mitreAttackService.techniques = res.filter(_ => _.type === "technique");
          this.mitreAttackService.tactics = res.filter(_ => _.type === "tactic");
          this.mitreAttackService.setAtmTactics();
          this._cdRef.detectChanges();
        }
      })
  }

  // Open tactics panel when user clicks on bottom double bar
  public openMitreAttack() {
    this.openedMitreAttack = true;
    this.mergedThreat = undefined;
    this.mitreAttackService.removedAfterMerge = [];
  }

  // EventEmitter to collapse tactics panel
  closeMitreAttackPopup($event: boolean) {
    this.openedMitreAttack = $event;
  }
  // Open riskUpdate popup when user comes from notification selection
  private riskUpdatePopup() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['threatRuleEngineId'] && params['type'] && params['projectId']) {
        this.resetThreatListToInitialState(this.threatRuleEngineId);
        this.threatRuleEngineId = params['threatRuleEngineId'];
        this.notificationType = params['type'];
        this._http.get(this.riskUpdateNotificationsUrl + "/notification?notificationType=" + this.notificationType + "&threatRuleEngineId=" + this.threatRuleEngineId + "&projectId=" + this.project.id).pipe(takeUntil(this.unsubscribe)).subscribe((notification: any) => {
          if (notification) {
            let positionNotificationDownwards: Boolean
            if (this.resultShared && this.resultShared.length > 0) {
              positionNotificationDownwards = this.setRiskUpdateByThreatRuleEngineId(this.resultShared, this.threatRuleEngineId);
            }
            const selectedThreat: ThreatItem = this.resultShared.find((_: ThreatItem) => _.threatRuleEngineId === notification.threatRuleEngineId);
            const rowNumber: number = selectedThreat.threatRowNumber ? selectedThreat.threatRowNumber : null;
            const dialogRef = this.dialog.open(RiskUpdateComponent, {
              minWidth: "1100px",
              height: "300px",
              position: { top: positionNotificationDownwards ? '27%' : '3%' },
              data: { notification, rowNumber: rowNumber, threat: selectedThreat },
              disableClose: true
            });
            dialogRef.afterClosed()
              .pipe(takeUntil(this.unsubscribe))
              .subscribe((dialogData: any) => {
                if (dialogData) {
                  if (dialogData.rejected) {
                    const threatIndex: number = this.resultShared.findIndex((_: ThreatItem) => _.threatRuleEngineId === this.threatRuleEngineId);
                    if (threatIndex > -1) {
                      this.resultShared[threatIndex].highlight = "";
                      this.setPaginationForThreats(this.resultShared);
                    }
                    this._snackBar.open("The notification is successfully rejected!", "", {
                      duration: 3000,
                    })
                  } else {
                    const threatIndex: number = dialogData.threat.findIndex(obj => obj.threatRuleEngineId == this.threatRuleEngineId);
                    if (threatIndex > -1) {
                      dialogData.threat[threatIndex].highlight = '';
                      const updatedThreatList: ThreatItem[] = this._resultShared.getUpdatedThreatList(dialogData.threat);
                      localStorage.setItem("result", JSON.stringify(updatedThreatList));
                      this._resultShared.loadLocalStorage();
                      this.setPaginationForThreats(dialogData.threat);
                    }
                    this._snackBar.open("The notification is successfully accepted!", "", {
                      duration: 3000,
                    })
                  }

                  setTimeout(() => {
                    this._router.navigate(
                      [],
                      {
                        relativeTo: this.activatedRoute,
                        queryParams: {}
                      });
                  }, 10);
                }
              });
          }
        });
      } else {
        this.resetThreatListToInitialState(this.threatRuleEngineId);
      }
    });
  }

  // Reset Threat List to initial state
  private resetThreatListToInitialState(threatRuleEngineId: string) {
    if (threatRuleEngineId) {
      const threatIndex: number = this.resultShared.findIndex((_: ThreatItem) => _.threatRuleEngineId === threatRuleEngineId);
      if (threatIndex > -1) {
        this.resultShared[threatIndex].highlight = "";
        this.setPaginationForThreats(this.resultShared);
      }
      this.threatRuleEngineId = undefined;
      this.notificationType = "";
    }
  }

  // Make riskUpdate threat highlighted and move to a specific pagination
  private setRiskUpdateByThreatRuleEngineId(result: any[], threatRuleEngineId: any) {
    const threatIndex: number = result.findIndex(obj => obj.threatRuleEngineId == threatRuleEngineId);
    if (threatIndex > -1) {
      const threatCount: number = threatIndex + 1;
      const pageSize: number = this.paginator.pageSize;
      let pageNumber: number = Math.floor(threatCount / pageSize);
      const remainder: number = Math.floor(threatCount % pageSize);
      if (remainder > 0) {
        pageNumber = pageNumber + 1;
      }
      this.currentPage = pageNumber - 1;
      result[threatIndex].isExpanded = true;
      result[threatIndex].highlight = "_riskUpdate";
      this.setPaginationForThreats(result);
      /* Scroll upto this threat */
      // Get Threat position in page
      const threatPositionOnPage = remainder == 0 ? pageSize : remainder
      const isThreatPositionOnUpperHalf = (threatPositionOnPage / pageSize) <= 0.5
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          const heightOfTheTable = document.getElementsByClassName('threatListTableContainer')[0].clientHeight
          const offsetForLowerPositionThreats = heightOfTheTable - 350
          const threatTopOffeset = document.getElementById(threatRuleEngineId).offsetTop;
          this.ngZone.run(() => {
            document.getElementsByClassName('threatListTableContainer')[0]
              .scrollTo({ top: isThreatPositionOnUpperHalf ? threatTopOffeset - 56 : threatTopOffeset - offsetForLowerPositionThreats, behavior: 'smooth' });
          })
        }, 100)
      });
      return isThreatPositionOnUpperHalf
    }
  }

  private getWP29AttackThreatInfo() {
    this._http
      .get(this.projectRootUrl + "/wp29Threats")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (res && res.length > 0) {
          this.wp29AttackIndexes = res.map((index: any) => index.wp29AttackIndex);
        }
      });
  }

  // Search threat list for given input in the search bar.
  private filterThreatListByInput(filterValue: string) {
    this.threatListViewType = ThreatListViewType.SearchResult;
    if (filterValue) {
      const allThreats: any[] = this._resultShared.getAllThreatsFromBackup() ? this._resultShared.getAllThreatsFromBackup() : [];
      this.resultShared = allThreats.filter((threat: any) => {
        const threatValueArray = Object.values(threat);
        const threatKeyArray = Object.keys(threat);
        for (let index = 0; index < threatValueArray.length; index++) {
          if (threatValueArray[index] && (threatKeyArray[index] != "id" || threatKeyArray[index] != "_id")) {
            const threatValue: string = threatValueArray[index].toString().toLowerCase();
            if (threatValue.includes(filterValue)) {
              return true;
            }
          }
        }
        return false;
      });
    } else {
      this.resultShared = this._resultShared.getAllThreatsFromBackup();
    }
    this.currentPage = 0;
    this.setPaginationForThreats(this.resultShared);
  }

  // Assign filter input value to subscription to perform search operation.
  applyFilter(event: Event) {
    this.filteredValueStream.next((event.target as HTMLInputElement).value.trim().toLowerCase());
  }

  filterHighlightedThreats() { // not used
    this.showHighlighted = !this.showHighlighted;
    if (this.showHighlighted) { // only show highlighted
      const filterValue = "_highlight";
      this.dataSource.filter = filterValue;
    } else { // show all threats
      this._spinner.show();
      const filterValue = "";
      this.dataSource.filter = filterValue;
      this._spinner.hide();
    }
  }

  // Apply filter for specific operation (search filter option) by threat property name and value.
  private applyFiltersForThreats(properties: string[] = [], propertiesValue: string[] = []) {
    const allThreats: any[] = this._resultShared.getAllThreatsFromBackup() ? this._resultShared.getAllThreatsFromBackup() : [];
    this.currentPage = 0;
    if (properties.length > 0 && propertiesValue.length > 0) {
      this.resultShared = allThreats.filter((threat: any) => {
        const threatValueArray: string[] = Object.values(threat);
        const threatKeyArray: string[] = Object.keys(threat);
        for (let index = 0; index < properties.length; index++) {
          const matchedPropertyIndex: number = threatKeyArray.findIndex((key: string) => key === properties[index]);
          if (matchedPropertyIndex) {
            if (threatValueArray[matchedPropertyIndex] == propertiesValue[index]) {
              return true;
            }
          }
        }
        return false;
      });
      this.setPaginationForThreats(this.resultShared);
    }
  }

  // Trigger action to show all threats from the search bar filter option.
  showAllThreats() {
    this.threatListViewType = ThreatListViewType.All;
    const updatedThreatList: ThreatItem[] = this._resultShared.getUpdatedThreatList(this.resultShared);
    this.currentPage = 0;
    this._resultShared.updateEntireResult(updatedThreatList);
  };

  // Trigger action to show highlighted threats from the search bar filter option.
  showHighlightedThreats() {
    this.threatListViewType = ThreatListViewType.Highlighted;
    this.applyFiltersForThreats(["highlight"], ["_highlight"]);
  };

  // Trigger action to show reviewed threats from the search bar filter option.
  showReviewedThreats() {
    this.threatListViewType = ThreatListViewType.Reviewed;
    this.applyFiltersForThreats(["reviewStatusForFilter"], ["reviewed"]);
  };

  // Trigger action to show not reviewed threats from the search bar filter option.
  showNotReviewedThreats() {
    this.threatListViewType = ThreatListViewType.NotReviewed;
    this.applyFiltersForThreats(["reviewStatusForFilter"], ["to-review"]);
  };

  // Trigger action to show validated threats from the search bar filter option.
  showValidatedThreats() {
    this.threatListViewType = ThreatListViewType.Validated;
    this.applyFiltersForThreats(["validateStatusForFilter"], ["validated"]);
  };

  // Trigger action to show not validated threats from the search bar filter option.
  showNotValidatedThreats() {
    this.threatListViewType = ThreatListViewType.NotValidated;
    this.applyFiltersForThreats(["validateStatusForFilter"], ["to-validate"]);
  };

  rateRisk(S, F, O, P, feasibilityLevel) {
    let impactLevel = this.impactAggregation(S, F, O, P);
    let riskLevel = this.calculateRiskFromMatrix(impactLevel, feasibilityLevel)
    return riskLevel
  }
  treatmentYN(treatmentBoolean) {
    if (treatmentBoolean) {
      return "Yes"
    } else {
      return "No"
    }
  }
  reviewedYN(reviewedBoolean) {
    if (reviewedBoolean) {
      return "Yes"
    } else {
      return "No"
    }
  }
  onTreatmentChange(event, row) {
    const index = this.resultShared.findIndex(obj => obj.id === row.id);
    this.resultShared[index].treatmentStatusChangedBy = this.currentUserProfile._id;
    this.resultShared[index].treatmentPickedDateTime = moment();
    if (event == "no treatment") { // if moved back to no treatment
      delete row.impactSLevelAfter;
      delete row.impactFLevelAfter;
      delete row.impactOLevelAfter;
      delete row.impactPLevelAfter;
      delete row.attackFeasibilityElapsedAfter;
      delete row.attackFeasibilityExpertiseAfter;
      delete row.attackFeasibilityKnowledgeAfter;
      delete row.attackFeasibilityWindowAfter;
      delete row.attackFeasibilityEquipmentAfter;
      delete row.attackFeasibilityElapsedAfterRationale;
      delete row.attackFeasibilityExpertiseAfterRationale;
      delete row.attackFeasibilityKnowledgeAfterRationale;
      delete row.attackFeasibilityWindowAfterRationale;
      delete row.attackFeasibilityEquipmentAfterRationale;
      delete row.riskLevelBefore;
      delete row.attackFeasibilityLevelAfter;
      this.onfeasibilityScoreChange(row);
    } else {
      row.impactSLevelAfter = row.impactSLevel;
      row.impactFLevelAfter = row.impactFLevel;
      row.impactOLevelAfter = row.impactOLevel;
      row.impactPLevelAfter = row.impactPLevel;
      row.attackFeasibilityElapsedAfter = row.attackFeasibilityElapsed;
      row.attackFeasibilityExpertiseAfter = row.attackFeasibilityExpertise;
      row.attackFeasibilityKnowledgeAfter = row.attackFeasibilityKnowledge;
      row.attackFeasibilityWindowAfter = row.attackFeasibilityWindow;
      row.attackFeasibilityEquipmentAfter = row.attackFeasibilityEquipment;
      row.attackFeasibilityElapsedAfterRationale = row.attackFeasibilityElapsedRationale;
      row.attackFeasibilityExpertiseAfterRationale = row.attackFeasibilityExpertiseRationale;
      row.attackFeasibilityKnowledgeAfterRationale = row.attackFeasibilityKnowledgeRationale;
      row.attackFeasibilityWindowAfterRationale = row.attackFeasibilityWindowRationale;
      row.attackFeasibilityEquipmentAfterRationale = row.attackFeasibilityEquipmentRationale;
      this.onfeasibilityScoreChange(row);
    }
  }
  treatmentValChange(event, row) {
    const index = this.resultShared.findIndex(obj => obj.id === row.id);
    if (event) { // if checked
      this.resultShared[index].treatmentVal = true;
      this.resultShared[index].validateStatusForFilter = "validated";
      this.resultShared[index].treatmentValidatedBy = this.currentUserProfile._id;
      this.resultShared[index].validateStatusRevokedBy = "";
      this.resultShared[index].validatedDateTime = moment();
    } else { // if unchecked
      this._confirmDialogService.open(this.confirmToUncheckValidateDialogOptions, true);
      this._confirmDialogService
        .confirmed()
        .subscribe(confirmed => {
          if (confirmed) { // only works if confirm button is clicked
            this.resultShared[index].treatmentVal = false;
            this.resultShared[index].validateStatusForFilter = "to-validate";
            this.resultShared[index].treatmentValidatedBy = "";
            this.resultShared[index].validateStatusRevokedBy = this.currentUserProfile._id;
            this.resultShared[index].validationRevokedDateTime = moment();
            if (this.threatListViewType === ThreatListViewType.Validated) {
              this.resultShared = this.resultShared.filter((threat: ThreatItem) => threat.id != row.id);
              this.dataSource.data = this.resultShared;
              this.totalRows = this.resultShared.length;
              if (this.totalRows <= this.pageSize) {
                this.currentPage = 0;
              }
            }
          } else { // if user clicks cancel or clicks outside of the dialog to exit the dialog
            // i have to change this to false and then back to true because ngModel has an issue to to detect change made by ngModelChange
            this.resultShared[index].treatmentVal = false;
            this.resultShared[index].validateStatusForFilter = "to-validate";
            setTimeout(() => {
              this.resultShared[index].treatmentVal = true;
              this.resultShared[index].validateStatusForFilter = "validated";
              // console.log(this.resultShared[index].reviewed)
              this._cdRef.detectChanges();
            }, 50);
          }
        })
    }
    // console.log(this.resultShared[index].treatmentValidatedBy);
  }
  reviewedChange(event, row) {
    // console.log(event);
    const index = this.resultShared.findIndex(obj => obj.id === row.id);
    if (index === -1) return;
    if (event) { // if checked
      this.resultShared[index].reviewed = true;
      this.resultShared[index].reviewStatusForFilter = "reviewed";
      this.resultShared[index].reviewedBy = this.currentUserProfile._id;
      this.resultShared[index].reviewStatusRevokedBy = "";
      this.resultShared[index].reviewedDateTime = moment();
      const updatedThreatList: ThreatItem[] = this._resultShared.getUpdatedThreatList(this.resultShared);
      localStorage.setItem('result', JSON.stringify(updatedThreatList));
      // this.reviewedResult.push(row);
      // localStorage.setItem('reviewedResult', JSON.stringify(this.reviewedResult));
      // if (!row.originalRiskLevel) row.originalRiskLevel = row.riskLevel; // if it's the first time review, record the risk level as the original
    } else { // if unchecked
      this._confirmDialogService.open(this.confirmToUncheckReviewedDialogOptions, true);
      this._confirmDialogService
        .confirmed()
        .subscribe(confirmed => {
          // console.log(confirmed)
          if (confirmed) { // only works if confirm button is clicked
            this.resultShared[index].reviewed = false;
            this.resultShared[index].reviewStatusForFilter = "to-review";
            this.resultShared[index].reviewedBy = "";
            this.resultShared[index].reviewStatusRevokedBy = this.currentUserProfile._id;
            this.resultShared[index].reviewStatusRevokedDateTime = moment();
            if (this.threatListViewType === ThreatListViewType.Reviewed) {
              this.resultShared = this.resultShared.filter((threat: ThreatItem) => threat.id != row.id);
              this.dataSource.data = this.resultShared;
              this.totalRows = this.resultShared.length;
              if (this.totalRows <= this.pageSize) {
                this.currentPage = 0;
              }
            }
            this._cdRef.detectChanges();
            // let removeIndex = this._ArrOp.findStringIndexInArrayProperty(row.id, "id", this.reviewedResult);
            // row.originalRiskLevel = "";
            // console.log(removeIndex)
            // this.reviewedResult.splice(removeIndex, 1);
            // console.log(this.reviewedResult)
            // localStorage.setItem('reviewedResult', JSON.stringify(this.reviewedResult));
          } else { // if user clicks cancel or clicks outside of the dialog to exit the dialog
            // i have to change this to false and then back to tru because ngModel has an issue to to detect change made by ngModelChange
            this.resultShared[index].reviewed = false;
            this.resultShared[index].reviewStatusForFilter = "to-review";
            setTimeout(() => {
              this.resultShared[index].reviewed = true;
              this.resultShared[index].reviewStatusForFilter = "reviewed";
              const updatedThreatList: ThreatItem[] = this._resultShared.getUpdatedThreatList(this.resultShared);
              localStorage.setItem('result', JSON.stringify(updatedThreatList));
              // console.log(this.resultShared[index].reviewed)
              this._cdRef.detectChanges();
            }, 50);
          }
        })
    }
    // this.resultShared[index].lastModifiedBy = this.currentUserProfile.username;
    // console.log(this.resultShared[index].reviewedBy);
  }
  recalculateRisk(row) {
    if (row.treatment == "no treatment") {
      let impactLevel = this.impactAggregation(row.impactSLevel, row.impactFLevel, row.impactOLevel, row.impactPLevel);
      row.riskLevel = this.calculateRiskFromMatrix(impactLevel, row.attackFeasibilityLevel);
      // if (row.impactSLevel && row.impactFLevel && row.impactOLevel && row.impactPLevel && row.attackFeasibilityLevel) { // if all parameters exist, rate risk
      // } else { // if lacking parameters, skip rating risk
      // }
    } else {
      let impactLevelBefore = this.impactAggregation(row.impactSLevel, row.impactFLevel, row.impactOLevel, row.impactPLevel);
      let impactLevel = this.impactAggregation(row.impactSLevelAfter, row.impactFLevelAfter, row.impactOLevelAfter, row.impactPLevelAfter);
      // console.log(impactLevel)
      row.riskLevel = this.calculateRiskFromMatrix(impactLevel, row.attackFeasibilityLevelAfter);
      row.riskLevelBefore = this.calculateRiskFromMatrix(impactLevelBefore, row.attackFeasibilityLevel);
      // if (row.impactSLevelAfter && row.impactFLevelAfter && row.impactOLevelAfter && row.impactPLevelAfter && row.attackFeasibilityLevel) { // if all parameters exist, rate risk
      // } else { // if lacking parameters, skip rating risk
      // }
    }
    row.lastModifiedBy = this.currentUserProfile._id;
    this._resultShared.updateEntireResult(this.resultShared);
  };

  getClassName(value) {
    let data: any;

    switch (value) {
      case this.impactLevelName[2]:
        data ="yellow-percentage"
        break;
      case this.impactLevelName[3]:
        data = "green-percentage"
        break;
      case this.impactLevelName[1]:
        data = "magenta-percentage"
        break;
      case this.impactLevelName[0]:
        data = "red-percentage"
        break;
    }

    return data;
  }

  getValueName(value) {
    let data: any;

    switch (value) {
      case this.impactLevelName[2]:
        data =50
        break;
      case this.impactLevelName[3]:
        data = 25
        break;
      case this.impactLevelName[1]:
        data = 75
        break;
      case this.impactLevelName[0]:
        data = 100
        break;
    }

    return data;
  }

  boundaryBtn() {
    this._confirmDialogService.open(this.confirmToEnableBoundaryeDialogOptions);
    this._confirmDialogService
      .confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.threatListViewType = ThreatListViewType.EnableItemBoundary;
          const allThreats: any[] = this._resultShared.getAllThreatsFromBackup() ? this._resultShared.getAllThreatsFromBackup() : [];
          this.resultShared = this._resultShared.filterResultByBoundary(this.newDesign, allThreats);
          this.setPaginationForThreats(this.resultShared);
          this._resultShared.resultUpdated = true;
          this._resultShared.updateEntireResult(this.resultShared);
          const updatedThreatList: ThreatItem[] = this._resultShared.getUpdatedThreatList(this.resultShared);
          localStorage.setItem('result', JSON.stringify(updatedThreatList));
          this._cdRef.detectChanges();
        }
      })
  }

  deleteRow(row) {
    const dialogRef = this.dialog.open(DeleteThreatComponent, {
      width: "500px",
      data: row.threatSource
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((dialogData: any) => {
        if (dialogData) {
          if (dialogData.type === "temporary") {
            this.deleteThreatTemporarily(row);
          } else if (dialogData.type === "permanent") {
            this.deleteThreatPermanently(row);
          }
        }
      });
  }

  // Delete a threat temporarily from threat list.
  private deleteThreatTemporarily(row: any) {
    let index: number = this.dataSource.data.indexOf(row) + (this.currentPage * this.pageSize);
    this.resultShared.splice(index, 1);
    this.setPaginationForThreats(this.resultShared);
    this._resultShared.deleteBackupThreatById(row.id);
    this._resultShared.resultUpdated = true;
    this._resultShared.updateEntireResult(this.resultShared);
    this._cdRef.detectChanges();
  }

  // Delete a threat permanently from threat list. Save the threat threatRuleEngineId to deletedThreatId array 
  private deleteThreatPermanently(row: any) {
    const threatRuleEngineId = row.threatRuleEngineId;

    this.deleteThreatTemporarily(row);

    const deletedThreatId = this.newDesign.project.deletedThreatId ? this.newDesign.project.deletedThreatId : [];
    if (!deletedThreatId.includes(threatRuleEngineId)) {
      deletedThreatId.push(threatRuleEngineId);
      this.newDesign.project.deletedThreatId = deletedThreatId;
      this._resultShared.permanentlyDeletedThreats = this._resultShared.permanentlyDeletedThreats ?
        [...this._resultShared.permanentlyDeletedThreats, row].filter((value: ThreatItem, index: number, self: ThreatItem[]) => self.findIndex((_: ThreatItem) => _.threatRuleEngineId === value.threatRuleEngineId) === index) :
        [row];
    }
    this._editDesignShared.updateEntireNewDesign(this.newDesign);
  }

  addRow(row, i) { // TODO: use MatDialogModule to add new items
    const backupThreats: ThreatItem[] = this._resultShared.getAllThreatsFromBackup();
    let lastBackUpThreatRowNumber: number = Math.max(...backupThreats.map((backupThreat: ThreatItem) => backupThreat.threatRowNumber));
    let sharedThreatIndex: number = this.dataSource.data.indexOf(row) + (this.currentPage * this.pageSize);
    let backupThreatIndex: number = backupThreats.indexOf(row) + (this.currentPage * this.pageSize);
    let newId = this._ArrOp.genRandomId(20);
    let newThreatItem = new ThreatItem("", "", "", 0, "", [], "", false, newId, "", 1, 1, 1, 1, "", "", "", "", "", [], "", "", 5, "", "", "", "", "no treatment", false,
      "userCreated", false, "", false);
    newThreatItem.threatSource = "userManual";
    this.resultShared.splice(sharedThreatIndex + 1, 0, newThreatItem);
    this.setPaginationForThreats(this.resultShared);
    newThreatItem.threatRowNumber = lastBackUpThreatRowNumber + 1;
    this._resultShared.addBackupThreatAtIndex(backupThreatIndex + 1, newThreatItem);
    this._resultShared.resultUpdated = true;
    this._resultShared.updateEntireResult(this.resultShared);
    this._cdRef.detectChanges();
  }
  saveAsNewRow(row, i) {
    const backupThreats: ThreatItem[] = this._resultShared.getAllThreatsFromBackup();
    let lastBackUpThreatRowNumber: number = Math.max(...backupThreats.map((backupThreat: ThreatItem) => backupThreat.threatRowNumber));
    let sharedThreatIndex: number = this.dataSource.data.indexOf(row) + (this.currentPage * this.pageSize);
    let backupThreatIndex: number = backupThreats.indexOf(row) + (this.currentPage * this.pageSize);
    let newId = this._ArrOp.genRandomId(20);
    // let newThreatItem = Object.create(row);
    let newThreatItem = new ThreatItem(row.componentId, row.asset, row.assetType, this.feasibilityTotalPipe.transform(row)
      , row.attackFeasibilityLevel, row.attackPath, row.attackPathName, row.attackSurface,
      newId, row.fromFeature, row.impactF, row.impactS, row.impactO, row.impactP, row.impactFLevel, row.impactSLevel, row.impactOLevel, row.impactPLevel, row.damageScenario,
      row.impactOriginCompAssFea, row.module, row.nickName, row.riskScore, row.riskLevel, row.securityPropertyCia, row.securityPropertyStride, row.threatScenario, "no treatment", false,
      "userCreated", false, "", false);
    newThreatItem.threatSource = "userManual";

    Object.keys(row).forEach((key) => {
      if (key.includes('attackFeasibility')) {
        newThreatItem[key] = row[key]
      }
    });

    // newThreatItem.id = newId;
    // newThreatItem.treatment = "no treatment";
    // newThreatItem.reviewed = false;
    // newThreatItem.treatmentVal = false;
    // newThreatItem.type = "userCreated";
    // newThreatItem.reviewedBy = "";
    // newThreatItem.isExpanded = false;
    newThreatItem.treatmentValidatedBy = "";
    newThreatItem.lastModifiedBy = "";
    newThreatItem.reviewStatusRevokedBy = "";
    newThreatItem.validateStatusRevokedBy = "";
    newThreatItem.treatmentStatusChangedBy = "";
    newThreatItem.reviewStatusRevokedDateTime = "";
    newThreatItem.reviewedDateTime = "";
    newThreatItem.treatmentPickedDateTime = "";
    newThreatItem.validatedDateTime = "";
    newThreatItem.validationRevokedDateTime = "";
    newThreatItem.riskUpdated = false;
    newThreatItem.threatRuleEngineId = "";
    newThreatItem.createdBy = this.currentUserProfile._id;
    newThreatItem.createdInProject = this.project.id;
    newThreatItem.highlight = "";
    newThreatItem.reviewStatusForFilter = "to-review";
    newThreatItem.validateStatusForFilter = "to-validate";
    newThreatItem.riskUpdateNotes = "";
    newThreatItem.threatRowNumber = lastBackUpThreatRowNumber + 1;
    this.resultShared.splice(sharedThreatIndex + 1, 0, newThreatItem);
    this.setPaginationForThreats(this.resultShared);
    this._resultShared.addBackupThreatAtIndex(backupThreatIndex + 1, newThreatItem);
    this._resultShared.resultUpdated = true;
    this._resultShared.updateEntireResult(this.resultShared);
    this._cdRef.detectChanges();
  }

  expandRow(row, i) {
    row.isExpanded = !row.isExpanded;
    if (row.feasibilityDetailsExpanded && row.feasibilityDetailsExpanded === true) {
      row.feasibilityDetailsExpanded = false;
    }
  }
  convertThreatSourceToUserManual(row) {
    row.threatSource = "userManual";
    row.threatRuleEngineId = "";
    this._resultShared.updateEntireResult(this.resultShared);
  }
  toggleHighlight(row, i) {
    if (row.highlight == "_highlight") {
      row.highlight = "";
      if (this.threatListViewType === ThreatListViewType.Highlighted) {
        this.resultShared = this.resultShared.filter((threat: ThreatItem) => threat.id != row.id);
        this.dataSource.data = this.resultShared;
        this.totalRows = this.resultShared.length;
        if (this.totalRows <= this.pageSize) {
          this.currentPage = 0;
        }
      }
    } else {
      row.highlight = "_highlight";
    }
    this._resultShared.resultUpdated = true;
    this._resultShared.updateEntireResult(this.resultShared);
  }
  onContentChange(row) {
    this.updatePagination = false;
    row.lastModifiedBy = this.currentUserProfile._id;
    this._resultShared.updateEntireResult(this.resultShared);
  }
  onFeatureChange(row) {
    row.lastModifiedBy = this.currentUserProfile._id;
    let featureIndex = this.featureList.name.indexOf(row.fromFeature);
    row.fromFeatureId = this.featureList.id[featureIndex];
    this._resultShared.updateEntireResult(this.resultShared);
    // this.convertThreatSourceToUserManual(row); // if the feature changed, it's no longer the same threat identified by threat engine
  }
  onComponentChange(row) {
    row.lastModifiedBy = this.currentUserProfile._id;
    let componentIndex = this.componentNickNameList.name.indexOf(row.nickName);
    row.componentId = this.componentNickNameList.id[componentIndex];
    row.type = this._editDesignShared.getComponentType(this.componentNickNameList.id[componentIndex]);
    this._resultShared.updateEntireResult(this.resultShared);
    // this.convertThreatSourceToUserManual(row); // if the component changed, it's no longer the same threat identified by threat engine
  }
  onThreatSourceChange(row, selection) {
    // console.log(selection);
    if (row.threatRuleEngineId.length > 0 && selection.value == "userManual") { // if the change is from ruleEngine to non-ruleEngine
      this._confirmDialogService.open(this.confirmToChangeThreatSourceToNonRuleEngineDialogOptions);
      this._confirmDialogService
        .confirmed()
        .subscribe(confirmed => {
          if (confirmed) { // only works if confirm button is clicked
            row.threatSource = selection.value;
            row.threatRuleEngineId = "";
          } else { // if user clicks cancel or clicks outside of the dialog to exit the dialog, do nothing
            let tempVar = row.threatSource;
            selection.source.writeValue(tempVar)
            row.threatSource = selection.value;
            setTimeout(() => { // have to do this because selection function will always fill the user-selected option, making it unmatch to the real value
              row.threatSource = tempVar;
              this._resultShared.updateEntireResult(this.resultShared);
            }, 50);
          }
        })
    } else { // no other selection is allowed
      let tempVar = row.threatSource;
      row.threatSource = selection.value;
      setTimeout(() => { // have to do this because selection function will always fill the user-selected option, making it unmatch to the real value
        row.threatSource = tempVar;
        this._resultShared.updateEntireResult(this.resultShared);
      }, 50);
      this._snackBar.open("This version only allows changing from Rule Engine to User Manually Added.", "Error", {
        duration: 3000,
      })
    }
  }
  calculateRiskFromMatrix(impact, feasibility): any { // risk determination function
    const impactIndex = this.impactLevelName.indexOf(impact);
    const feasibilityIndex = this.feasibilityLevelName.indexOf(feasibility);
    if (impactIndex >= 0 && feasibilityIndex >= 0) {
      return this.riskMatrix[feasibilityIndex][impactIndex]
    } else 5
  }
  impactAggregation(S, F, O, P): string { // impact aggregation function. take the most severe impact among the four.
    if (this.impactAggMethod == "mostSevere") {
      let aggregatedImpactIndex = Math.min(this.impactLevelName.indexOf(S), this.impactLevelName.indexOf(F), this.impactLevelName.indexOf(O), this.impactLevelName.indexOf(P));
      // console.log(this.impactLevelName.indexOf(S));
      // console.log(this.impactLevelName.indexOf(F));
      // console.log(this.impactLevelName.indexOf(O));
      // console.log(this.impactLevelName.indexOf(P));
      // console.log(aggregatedImpactIndex);
      let aggregatedImpact = this.impactLevelName[aggregatedImpactIndex];
      return aggregatedImpact
    }
  }
  // updateReviewedResult() {
  //   if (this.resultShared) {
  //     this.resultShared.forEach((threat, index) => {
  //       if (threat.reviewed) {
  //         this.reviewedResult.push(threat)
  //       }
  //     })
  //   }
  // }
  linkThreat(row, index) {
    if (row.fromFeatureId) { // only saves if the threat is attached to a feature
      row.createdBy = this.currentUserProfile._id;
      row.createdInProject = this.project.id;
      let rowForDb = JSON.parse(JSON.stringify(row)); // create a duplicate of the threat object, so properties can be changed before committing to database without affecting the current project
      rowForDb.threatSource = "userAddedThreatLib";
      rowForDb.highlight = "";
      rowForDb.isExpanded = false;
      rowForDb.reviewed = false;
      rowForDb.reviewedBy = "";
      rowForDb.treatmentValidatedBy = "";
      rowForDb.reviewStatusRevokedBy = "";
      rowForDb.validateStatusRevokedBy = "";
      rowForDb.treatmentStatusChangedBy = "";
      rowForDb.reviewStatusRevokedDateTime = "";
      rowForDb.reviewedDateTime = "";
      rowForDb.treatmentPickedDateTime = "";
      rowForDb.validatedDateTime = "";
      rowForDb.validationRevokedDateTime = "";
      rowForDb.treatment = "no treatment";
      rowForDb.treatmentVal = false;
      rowForDb.lastModifiedBy = "";
      this._http
        .post(this.secureduserRootUrl + "/userAddedThreatLib", rowForDb)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          this._snackBar.open(res.msg, "", {
            duration: 3000,
          })
        });
    } else {
      this._snackBar.open("The threat needs to be attached to a feature. Please select a feature.", "", {
        duration: 4000,
      })
    }

  }
  onfeasibilityScoreChange(row) {
    if (row.treatment == "no treatment") {
      row.attackFeasibilityLevel = this._resultShared.rateFeasibility(row, this.feasibilityMethod, this.feasibilityLevelName, this.feasibilityRating);
      this.recalculateRisk(row);
    } else {
      row.attackFeasibilityLevel = this._resultShared.rateFeasibility(row, this.feasibilityMethod, this.feasibilityLevelName, this.feasibilityRating);
      row.attackFeasibilityLevelAfter = this.rateFeasibilityAfter(row, this.feasibilityMethod, this.feasibilityLevelName, this.feasibilityRating);
      this.recalculateRisk(row);
    }
    row.lastModifiedBy = this.currentUserProfile._id;
    const index = this.resultShared.findIndex(obj => obj.id === row.id);
    this.resultShared[index].attackFeasibility = this.feasibilityTotalPipe.transform(row)
    this._resultShared.updateEntireResult(this.resultShared);
  }
  updateEnumerateValue(event: string, row: any, property: string, obj: any) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    const keyIndex = keys.findIndex(key => key === event);
    if (keyIndex > -1) {
      const value = values[keyIndex];
      row[property] = value;
      this.onfeasibilityScoreChange(row);
    }
  }

  // function to update featureList
  updateFeatureList(designData) {
    let nameArray = [];
    let idArray = [];
    this.componentNickNameList.name = [];
    this.componentNickNameList.id = [];
    // collect all features
    designData.micro.forEach(element => {
      this.componentNickNameList.name.push(element.nickName);
      this.componentNickNameList.id.push(element.id);
      Array.prototype.push.apply(nameArray, element.feature);
      Array.prototype.push.apply(idArray, element.featureId);
    });
    designData.controlUnit.forEach(element => {
      this.componentNickNameList.name.push(element.nickName);
      this.componentNickNameList.id.push(element.id);
      Array.prototype.push.apply(nameArray, element.feature);
      Array.prototype.push.apply(idArray, element.featureId);
    });
    designData.commLine.forEach(element => {
      this.componentNickNameList.name.push(element.nickName);
      this.componentNickNameList.id.push(element.id);
      Array.prototype.push.apply(nameArray, element.feature);
      Array.prototype.push.apply(idArray, element.featureId);
    });
    // remove duplicates
    this.featureList.name = [...new Set(nameArray)];
    this.featureList.id = [...new Set(idArray)];
    // console.dir(this.featureList)
  }
  // function to rate feasibility level if a feasibility metric is changed in the collapsed table row
  // rateFeasibility(threatItem, feasibilityMethod, feasibilityLevelName, feasibilityRating) {
  //   let score = 0;
  //   let level = feasibilityLevelName[0]; // High
  //   switch (feasibilityMethod) {
  //     case "Attack Potential":
  //       score = threatItem.attackFeasibilityKnowledge + threatItem.attackFeasibilityExpertise + threatItem.attackFeasibilityEquipment
  //         + threatItem.attackFeasibilityElapsed + threatItem.attackFeasibilityWindow;
  //       if (score <= feasibilityRating[0]) {
  //         level = feasibilityLevelName[0]; // High
  //       } else if (score <= feasibilityRating[1]) {
  //         level = feasibilityLevelName[1]; // Medium
  //       } else if (score <= feasibilityRating[2]) {
  //         level = feasibilityLevelName[2]; // Low
  //       } else {
  //         level = feasibilityLevelName[3]; // Very Low
  //       }
  //       break;
  //     case "Attack Vector":
  //       level = threatItem.attackFeasibilityAttackVector;
  //       break;
  //     case "CVSS":
  //       // use environment variable to replace CVSSVector and attackVector from database
  //       let CVSSVector = 0;
  //       let trueAV = "";
  //       trueAV = threatItem.attackFeasibilityAttackVector;
  //       switch (trueAV) {
  //         case "High":
  //           CVSSVector = 0.85;
  //           break;
  //         case "Medium":
  //           CVSSVector = 0.6;
  //           break;
  //         case "Local":
  //           CVSSVector = 0.4;
  //           break;
  //         case "Physical":
  //           CVSSVector = 0.2;
  //           break;
  //         default:
  //           CVSSVector = 0.85;
  //       };
  //       score = 8.22 * CVSSVector * threatItem.attackFeasibilityCVSSPrivilege * threatItem.attackFeasibilityCVSSComplexity
  //         * threatItem.attackFeasibilityCVSSUser;
  //       if (score >= feasibilityRating[0]) {
  //         level = feasibilityLevelName[0]; // High
  //       } else if (score >= feasibilityRating[1]) {
  //         level = feasibilityLevelName[1]; // Medium
  //       } else if (score >= feasibilityRating[2]) {
  //         level = feasibilityLevelName[2]; // Low
  //       } else {
  //         level = feasibilityLevelName[3]; // Very Low
  //       }
  //       break;
  //   }
  //   return level;
  // }
  rateFeasibilityAfter(threatItem, feasibilityMethod, feasibilityLevelName, feasibilityRating) {
    let score = 0;
    let level = feasibilityLevelName[0]; // High
    switch (feasibilityMethod) {
      case "Attack Potential":
        score = threatItem.attackFeasibilityKnowledgeAfter + threatItem.attackFeasibilityExpertiseAfter + threatItem.attackFeasibilityEquipmentAfter
          + threatItem.attackFeasibilityElapsedAfter + threatItem.attackFeasibilityWindowAfter;
        if (score <= feasibilityRating[0]) {
          level = feasibilityLevelName[0]; // High
        } else if (score <= feasibilityRating[1]) {
          level = feasibilityLevelName[1]; // Medium
        } else if (score <= feasibilityRating[2]) {
          level = feasibilityLevelName[2]; // Low
        } else {
          level = feasibilityLevelName[3]; // Very Low
        }
        break;
      case "Attack Vector":
        level = threatItem.attackFeasibilityAttackVectorAfter;
        break;
      case "CVSS":
        // use environment variable to replace CVSSVector and attackVector from database
        let CVSSVector = 0;
        let trueAV = "";
        trueAV = threatItem.attackFeasibilityAttackVectorAfter;
        switch (trueAV) {
          case "High":
            CVSSVector = 0.85;
            break;
          case "Medium":
            CVSSVector = 0.6;
            break;
          case "Local":
            CVSSVector = 0.4;
            break;
          case "Physical":
            CVSSVector = 0.2;
            break;
          default:
            CVSSVector = 0.85;
        };
        score = 8.22 * CVSSVector * threatItem.attackFeasibilityCVSSPrivilegeAfter * threatItem.attackFeasibilityCVSSComplexityAfter
          * threatItem.attackFeasibilityCVSSUserAfter;
        if (score >= feasibilityRating[0]) {
          level = feasibilityLevelName[0]; // High
        } else if (score >= feasibilityRating[1]) {
          level = feasibilityLevelName[1]; // Medium
        } else if (score >= feasibilityRating[2]) {
          level = feasibilityLevelName[2]; // Low
        } else {
          level = feasibilityLevelName[3]; // Very Low
        }
        break;
    }
    return level;
  }

  trackByProperty(index: number, value: any) {
    return `property-${index}-${value}`;
  }

  trackByComponent(index: number, value: any) {
    return `component-${index}-${value}`;
  }

  trackByFeature(index: number, value: any) {
    return `feature-${index}-${value}`;
  }

  trackByTreatment(index: number, value: any) {
    return `treatment-${index}-${value}`;
  }

  trackByTreatSource(index: number, value: any) {
    return `treat-source-${index}`;
  }

  trackByImpactLevel(index: number, value: any) {
    return `impact-level-${index}`;
  }

  trackByImpactLevelOptions(index: number, value: any) {
    return `impact-level-options-${index}`;
  }

  trackByFinancialImpactLevel(index: number, value: any) {
    return `financial-impact-level-${index}`;
  }

  trackByFinanclImpactLebelOpt(index: number, value: any) {
    return `financial-impact-level-opt-${index}`;
  }

  trackByOperationalImpactLevel(index: number, value: any) {
    return `operational-impact-level-${index}`;
  }

  trackByOperationalImpactLevelOpt(index: number, value: any) {
    return `operational-impact-level-opt-${index}`;
  }

  trackByPrivacyImpactLevel(index: number, value: any) {
    return `privacy-impact-level-${index}`;
  }

  trackByPrivacyImpactLevelOpt(index: number, value: any) {
    return `privacy-impact-level-opt-${index}`;
  }

  trackBySafetyImpactLevel(index: number, value: any) {
    return `safety-impact-level-${index}`;
  }

  trackByNoTraetmentFinancial(index: number, value: any) {
    return `notreatment-fin-impact-level-${index}`;
  }

  trackByNoTreatmentOperational(index: number, value: any) {
    return `notreatment-ope-impact-level-${index}`;
  }

  trackByNoTreatmentPrivacy(index: number, value: any) {
    return `notreatment-privacy-impact-level-${index}`;
  }

  testThreatSource(value: string) {
    if (value != "userManual") {
      return true
    } else {
      return false
    }
  }

  // Drop threat between threat list table and tactic list. When dropped from tactic list do nothing on threat list but remove threat from tactic list
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer.id === event.container.id) {

    } else if (event.previousContainer.id === ControlThreatContainer.Before) {
      this.mitreAttackService.mitreControlBeforeThreat = undefined;
    } else if (event.previousContainer.id === ControlThreatContainer.After) {
      this.mitreAttackService.mitreControlAfterThreat = undefined;
    } else {
      const data = event.item.data;
      switch (data.mitreAttackMethod) {
        case "ATM":
          const threat: ThreatItem = data.threat;
          this.mitreAttackService.deleteTacticThreat(data.tactic.vId, event.previousIndex);
          break;
        default:
          break;
      }
    }
  }

  // Re-construct tactics panel upon clicking "Show Merged Threat"
  public showMergedThreat(row: ThreatItem) {
    this.toggleMergedThreatChanges = !this.toggleMergedThreatChanges;
    this.openMitreAttack();
    if (row?.mitreAttackIndex) {
      this.mergedThreat = row;
    } else {
      this.mitreAttackService.mitreControlBeforeThreat = JSON.parse(row.threatBeforeControl)
      this.mitreAttackService.mitreControlAfterThreat = row
    }
  }

  // Show threat history in a pop-up
  public showThreatHistory(row: ThreatItem) {
    const dialogRef = this.dialog.open(ThreatHistoryComponent, {
      width: "80vw",
      height: "60vh",
      panelClass: "threat-history-dialog",
      data: {
        threatRuleEngineId: row.threatRuleEngineId,
        projectId: this.project.id,
        impactLevelName: this.impactLevelName,
        impactAggMethod: this.impactAggMethod
      }
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((dialogData: any) => {
        if (dialogData) {
        }
      });
  }
}
