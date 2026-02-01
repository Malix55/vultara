import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthenticationService, UserProfile } from '../services/authentication.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { VulnerabilityService } from '../services/vulnerability.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationsService } from '../services/notifications.service';
import { DesignSettingsService } from '../services/design-settings.service';
import { WeaknessAnalysisDialog } from '../dialogues/weakness-analysis/weakness-analysis-dialog.component';
import { AddWeaknessDialog } from '../dialogues/add-weakness-dialog/add-weakness-dialog.component';
import { WeaknessLinkVulnerabilityDialog } from '../dialogues/weakness-link-vulnerability-dialog/weakness-link-vulnerability-dialog.component';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
@Component({
  selector: 'app-weakness-view',
  templateUrl: './weakness-view.component.html',
  styleUrls: ['./weakness-view.component.css']
})
export class WeaknessViewComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('searchInput') input: ElementRef<HTMLInputElement>;
  displayedColumns: string[] = ['weaknessNumber', 'dateIdentified',
    'identificationMethod', 'sourceNotes', 'component', 'attackSurface', 'asset',
    'weaknessDescription', 'cweId', 'cweWeaknessType', 'cweCategory', 'vulnerabilityAnalysis',
    'vulnerabilitiesLinked', 'tableOp'
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  archivedDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalDataSource = []
  readonly newDesign = JSON.parse(localStorage.getItem("newDesign"));
  currentUserProfile: UserProfile
  private unsubscribe: Subject<void> = new Subject();
  weaknessUrl = `${environment.backendApiUrl}weakness/${this.newDesign.project.id}`
  vulnerabilitiesUrl = `${environment.backendApiUrl}vulnerability/${this.newDesign.project.id}`
  tabIndex = 0;
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
  confirmToDelete = {
    title: "CONFIRMATION",
    message: "Are you sure you want to delete this weakness? This will unlink all vulnerabilities that are linked to this weakness",
    cancelText: "Cancel",
    confirmText: "Delete",
  };

  constructor(private http: HttpClient, private _authService: AuthenticationService, private _dialog: MatDialog,
    private _spinner: NgxSpinnerService, private _vulnerabilityService: VulnerabilityService, private router: Router,
    private _snackBar: MatSnackBar, public editDesignShared: DesignSettingsService,
    private _confirmDialogService: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    this.getProjectWeaknesses()
  }

  getProjectWeaknesses() {
    if (this.editDesignShared.projectStatus?.milestoneView) {//If milestone load data from milestone
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("find", "weakness").set("id",this.newDesign.project.id);
      this.http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        this.assigData(res.weakness);
        this.originalDataSource = [...this.dataSource.data];
        this._spinner.hide("weakness-spinner");
        // this.highlightRow()
      },
        (error) => this._spinner.hide("weakness-spinner"),
        () => this._spinner.hide("weakness-spinner")
      )
    } else {
      this._spinner.show("weakness-spinner");
      localStorage.setItem("intendedUrl", this.router.url);
      let params = new HttpParams().set("id", this.newDesign.project.id);
      this.http.get(this.weaknessUrl,{params}).pipe(takeUntil(this.unsubscribe))
        .subscribe((data: any[]) => {
          this.assigData(data)
          this.originalDataSource = [...this.dataSource.data];
          this._spinner.hide("weakness-spinner");
          // this.highlightRow()
        },
          (error) => this._spinner.hide("weakness-spinner"),
          () => this._spinner.hide("weakness-spinner")
        )
    }
    this.currentUserProfile = this._authService.currentUserValue();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  assigData(weakness?) {// assign data to archived and active tab based on set conditions
    let data;
    if (weakness) {
      data = weakness
    } else {
      data = [...this.dataSource.data, ...this.archivedDataSource.data];
    }
    const archivedData = [];
    const activeData = [];
    data.forEach(item => {
      if (item.vulnerabilityAnalysis == "Completed" && item.exploitable == "No") {
        archivedData.push(item)
      } else {
        activeData.push(item)
      }
    })
    this.dataSource.data = activeData.sort(function (a, b) {
      return parseFloat(a.weaknessNumber) - parseFloat(b.weaknessNumber);
    });
    this.archivedDataSource.data = archivedData.sort(function (a, b) {
      return parseFloat(a.weaknessNumber) - parseFloat(b.weaknessNumber);
    });;
  }

  /*Triggers when user types on seach bar, filter datasource w.r.t search text
  We have to keep copy of original data so that we don't loose data while showing search results.*/
  search(event) {
    const searchText = event.target.value.toLowerCase()
    this.dataSource.data = this.originalDataSource.filter(item => Object.values(item).join(" ").toLowerCase().includes(searchText))
  }
  /*Show original datashource on refresh table*/
  refreshTable() {
    this.input.nativeElement.value = ""
    this.dataSource.data = this.originalDataSource
  }

  //Edit analysis dialog
  editAnalysis(row, type) {
    const dialogRef = this._dialog.open(WeaknessAnalysisDialog, {
      disableClose: true,
      data: { row, type, milestoneView: this.editDesignShared.projectStatus?.milestoneView },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.http.patch(this.weaknessUrl, { singleUpdate: true, res, projectId:this.newDesign.project.id }).pipe(takeUntil(this.unsubscribe)).subscribe(response => {
          if (response) {
            if (res.deLink) {//If weakness analysis reviewed is unchecked then delink all vulnerabilities from weakness
              const data = { weaknessData: { linkedVulnerabilities: [], _id: row._id }, linkWeakness: true, projectId:this.newDesign.project.id };
              this.removeVulnerabilitiesFromWeakness(data);
              this.removeWeaknessesFromVulnerabilities(row);
            }
            this._snackBar.open(`Weakness analysis updated successfully`, "Success", {
              duration: 3000,
            });
            this.updateRow(res, "updated");
            if (res.vulnerabilityAnalysis == "Completed") {
              const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
              if (res.exploitable == "Yes") {
                this.linkedVulnerabilities(this.dataSource.data[rowIndex]);
              }
            }
          }
        })
      }
    })
  }

  //Open dialog to edit or add a weakness to the database
  addWeakness(row?) {
    const data = row ?? ""
    const dialogRef = this._dialog.open(AddWeaknessDialog, {
      disableClose: true,
      data
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res && row) {
        this.updateSingleWeakness(res);
      } else if (res) {
        res.projectId = this.newDesign.project.id;
        this.http.post(this.weaknessUrl, {data:res, projectId:this.newDesign.project.id}).pipe(takeUntil(this.unsubscribe)).subscribe(resp => {
          if (resp) {
            this._snackBar.open(`Weakness added successfully.`, "Success", {
              duration: 3000,
            });
            this.updateRow(resp, "add");
          }
        })
      }
    })
  }

  //Link vulnerabilities to a weakness
  linkedVulnerabilities(row) {
    const dialogRef = this._dialog.open(WeaknessLinkVulnerabilityDialog, {
      disableClose: true,
      data: { weakness: row, projectId: this.newDesign.project.id },
      width: '80%',
      height: '90vh',
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.http.patch(this.vulnerabilitiesUrl, res).subscribe(response => { });
        if (res.generated) {//If there are generated vulnerabilities send post requst
          const data = { added: [res.generated], projectId:this.newDesign.project.id}
          this.http.post(this.vulnerabilitiesUrl, data).subscribe((respond: any) => {
            if (respond) {//wait for generated vulnerability Id and add it to the weakness
              res.weaknessData.linkedVulnerabilities.push(respond.resp.insertedIds[0]._id)
              this.http.patch(this.weaknessUrl, res).subscribe(respons => {
                this._snackBar.open(`Vulnerabilities linked successfully.`, "Success", {
                  duration: 3000,
                });
              });
            }
          });
        } else {//If there is no generated vulnerability update the weakness with linked vulnerabilities
          this.http.patch(this.weaknessUrl, res).subscribe(respons => {
            if (respons) {
              this._snackBar.open(`Vulnerabilities linked successfully.`, "Success", {
                duration: 3000,
              });
            }
          });
        }
        const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
        this.dataSource.data[rowIndex].linkedVulnerabilities = res.weaknessData.linkedVulnerabilities;
        this.updateDataSource();
      }
    })
  }

  removeVulnerabilitiesFromWeakness(data) {
    this.http.patch(this.weaknessUrl, data).subscribe(respons => {
      const rowIndex = this.dataSource.data.findIndex(item => item._id == data.weaknessData._id);
      this.dataSource.data[rowIndex].linkedVulnerabilities = data.weaknessData.linkedVulnerabilities;
      this.updateDataSource();
    });
  }

  updateSingleWeakness(res) {
    this.http.patch(this.weaknessUrl, { singleUpdate: true, res , projectId:this.newDesign.project.id}).pipe(takeUntil(this.unsubscribe)).subscribe(response => {
      if (response) {
        this.updateRow(res);
        this._snackBar.open(`Weakness updated successfully.`, "Success", {
          duration: 3000,
        });
      }
    })
  }

  /*converts boolean value of reviewed and validated to yes and no to show on checkboxes*/
  convertBoolToYesNo(rowBooleanVals) {
    return rowBooleanVals ? 'Yes' : 'No'
  }

  /* triggers when user press delete option on any row, opens delete dialog and update row on delete */
  deleteRow(row) {
    this._confirmDialogService.open(this.confirmToDelete);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      if (confirmed) {
        let params = new HttpParams().set("_id", row._id).set('id',this.newDesign.project.id);
        this.removeWeaknessesFromVulnerabilities(row);
        this.http.delete(this.weaknessUrl, { params }).pipe(takeUntil(this.unsubscribe)).subscribe(response => {
          if (response) {
            this._snackBar.open(`Weakness deleted successfully`, "Success", {
              duration: 3000,
            });
          }
        })
        let rowIndex;
        if (this.tabIndex == 0) {
          rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
          this.dataSource.data.splice(rowIndex, 1);
          this.updateDataSource();
        } else {
          rowIndex = this.archivedDataSource.data.findIndex(item => item._id == row._id)
          this.archivedDataSource.data.splice(rowIndex, 1);
          this.updateDataSource()
        }
      }
    })
  }
  removeWeaknessesFromVulnerabilities(row) {
    if (row?.linkedVulnerabilities?.length) {
      const data = row.linkedVulnerabilities.map(function (id) {
        return { _id: id, linkedWeakness: row._id };
      });
      const ds = { data, removeWeakness: true , projectId:this.newDesign.project.id}
      this.http.patch(this.vulnerabilitiesUrl, ds).subscribe(response => { });
    }
  }

  /*triggers when user click highlight option*/
  toggleHighlight(row) {
    row.highlighted = !row.highlighted;
    let rowIndex;
    let data;
    if (this.tabIndex == 0) {
      rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
      data = this.dataSource.data[rowIndex];
    } else {
      rowIndex = this.archivedDataSource.data.findIndex(item => item._id == row._id)
      data = this.archivedDataSource.data[rowIndex];
    }
    this.updateSingleWeakness(data);
  }
  /*Trigers from delete and add functions to update the data sourse of grid. We have to keep copy of original data
    so that we don't loose data while showing search results.
  */
  updateDataSource() {
    this.dataSource.data = [...this.dataSource.data]
    this.archivedDataSource.data = [...this.archivedDataSource.data]
    this.originalDataSource = [...this.dataSource.data]
  }

  updateRow(row, type?) {
    let rowIndex;
    if (type == 'updated') {
      if (this.tabIndex == 0) {
        rowIndex = this.dataSource.data.findIndex(item => item._id == row._id)
        this.dataSource.data[rowIndex].exploitable = row.exploitable;
        this.dataSource.data[rowIndex].exploitableRationale = row.exploitableRationale;
        this.dataSource.data[rowIndex].preControlRiskValue = row.preControlRiskValue;
        this.dataSource.data[rowIndex].riskRationale = row.riskRationale;
        this.dataSource.data[rowIndex].vulnerabilityAnalysis = row.vulnerabilityAnalysis;
        this.dataSource.data[rowIndex].analysisReviewed = row.analysisReviewed;
      } else {
        rowIndex = this.archivedDataSource.data.findIndex(item => item._id == row._id)
        this.archivedDataSource.data[rowIndex].exploitable = row.exploitable;
        this.archivedDataSource.data[rowIndex].exploitableRationale = row.exploitableRationale;
        this.archivedDataSource.data[rowIndex].preControlRiskValue = row.preControlRiskValue;
        this.archivedDataSource.data[rowIndex].riskRationale = row.riskRationale;
        this.archivedDataSource.data[rowIndex].vulnerabilityAnalysis = row.vulnerabilityAnalysis;
        this.archivedDataSource.data[rowIndex].analysisReviewed = row.analysisReviewed;
      }
    } else if (type == "add") {
      this.dataSource.data.push(row);
    } else {
      if (this.tabIndex == 0) {
        rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
        this.dataSource.data[rowIndex].dateIdentified = row.dateIdentified;
        this.dataSource.data[rowIndex].identificationMethod = row.identificationMethod;
        this.dataSource.data[rowIndex].sourceNotes = row.sourceNotes;
        this.dataSource.data[rowIndex].component = row.component;
        this.dataSource.data[rowIndex].attackSurface = row.attackSurface;
        this.dataSource.data[rowIndex].asset = row.asset;
        this.dataSource.data[rowIndex].weaknessDescription = row.weaknessDescription;
        this.dataSource.data[rowIndex].cweId = row.cweId;
        this.dataSource.data[rowIndex].weaknessNumber = row.weaknessNumber;
        this.dataSource.data[rowIndex].cweWeaknessType = row.cweWeaknessType;
        this.dataSource.data[rowIndex].cweWeaknessCategory = row.cweWeaknessCategory;
        this.dataSource.data[rowIndex].sourceLink = row.sourceLink;
      } else {
        rowIndex = this.archivedDataSource.data.findIndex(item => item._id == row._id);
        this.archivedDataSource.data[rowIndex].dateIdentified = row.dateIdentified;
        this.archivedDataSource.data[rowIndex].identificationMethod = row.identificationMethod;
        this.archivedDataSource.data[rowIndex].sourceNotes = row.sourceNotes;
        this.archivedDataSource.data[rowIndex].component = row.component;
        this.archivedDataSource.data[rowIndex].attackSurface = row.attackSurface;
        this.archivedDataSource.data[rowIndex].asset = row.asset;
        this.archivedDataSource.data[rowIndex].weaknessDescription = row.weaknessDescription;
        this.archivedDataSource.data[rowIndex].cweId = row.cweId;
        this.archivedDataSource.data[rowIndex].weaknessNumber = row.weaknessNumber;
        this.archivedDataSource.data[rowIndex].cweWeaknessType = row.cweWeaknessType;
        this.archivedDataSource.data[rowIndex].cweWeaknessCategory = row.cweWeaknessCategory;
        this.archivedDataSource.data[rowIndex].sourceLink = row.sourceLink;
      }
    }
    this.assigData();
    this.updateDataSource()
    this.dataSource.paginator = this.paginator; // Refreshes current page so data is updated
  }

  //Track whether its the active tab or archived tab
  settingsTabClick($event) {
    if ($event.index == 0) {
      this.tabIndex = 0;
    }
    if ($event.index == 1) {
      this.tabIndex = 1;
    }
  }
}