import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DesignSettingsService } from '../services/design-settings.service';
import { AssumptionService } from '../services/assumption.service';
import { Assumption } from 'src/threatmodel/ItemDefinition';
import { AddAssumptionDialogComponent } from 'src/app/dialogues/add-assumption-dialog/add-assumption-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { DeleteAssumptionComponent } from '../dialogues/delete-assumption/delete-assumption.component';

@Component({
  selector: 'app-assumptions',
  templateUrl: './assumptions-view.component.html',
  styleUrls: ['./assumptions-view.component.css']
})
export class AssumptionsComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns: string[] = ['no', 'content', 'action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalDataSource: Assumption[] = []
  readonly newDesign = JSON.parse(localStorage.getItem("newDesign"));
  private unsubscribe: Subject<void> = new Subject<void>();
  assumptionUrl = `${environment.backendApiUrl}assumption/${this.newDesign.project.id}`
  constructor(
    public editDesignShared: DesignSettingsService,
    private http: HttpClient,
    private _snackBar: MatSnackBar,
    private _spinner: NgxSpinnerService,
    private _dialog: MatDialog,
    private assumptionService: AssumptionService
  ) { }

  ngOnInit(): void {
    if (this.editDesignShared.projectStatus?.milestoneView) {
      this._spinner.show()
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("assumption", "true").set("id",this.newDesign.project.id);
      this.http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        if (res.assumptions.length) {
          this.assumptionService.updateProjectAssumption(res.assumptions);
          this._spinner.hide();
        } else {
          this._spinner.hide();
        }
      })
    } else {
      let params = new HttpParams().set("id",this.newDesign.project.id);
      this._spinner.show()
      this.http.get(this.assumptionUrl,{params}).pipe(takeUntil(this.unsubscribe))
        .subscribe((data: any[]) => {
          if (data.length) {
            this.assumptionService.updateProjectAssumption(data)
            this._spinner.hide();
          } else {
            this._spinner.hide();
          }
        })
    }
    this.assumptionService.projectAssumption$.pipe(takeUntil(this.unsubscribe)).subscribe((res: Assumption[]) => {
      if (res) {
        this.dataSource.data = res
      }
    })
    this.assumptionService.currentaddedIds.subscribe(currentData => {
      if (currentData) {
        this.updateAdded(currentData)
      }
    })
  }
  updateAdded(data) {// update _id of assumption added to db
    const added = this.assumptionService.addedAssumptions
    added.map((item, index) => {
      let assumptionIndex = this.dataSource.data.findIndex(d => item.rowNumber == d.rowNumber)
      if (assumptionIndex > -1) {
        this.dataSource.data[assumptionIndex]._id = data.resp.insertedIds[index]._id;
        this.dataSource.data[assumptionIndex].isNew = false;
      }
    })
    this.assumptionService.addedAssumptions = []
    this.assumptionService.updateAddedIds(null)
  }

  updateRow(row, type, data) { // get the updated row data and udpate the variable in the service
    if (type == 'updated') {
      const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
      this.dataSource.data[rowIndex] = row;
    } else {
      row._id = data.resp.insertedIds[0]._id
      this.dataSource.data.push(row);
    }
    this.assumptionService.updateProjectAssumption(this.dataSource.data);
    this.dataSource.paginator = this.paginator; // Refreshes current page so data is updated
  }

  /* triggers when user press delete option on any row, opens delete dialog and update row on delete */
  deleteRow(row) {
    const dialogRef = this._dialog.open(DeleteAssumptionComponent, {
      width: "500px",
      data: row
    });
    dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe)).subscribe(result => {
      if (result == 'delete') {
        this.http.post(this.assumptionUrl, { deleted: [row], projectId:this.newDesign.project.id }).pipe(takeUntil(this.unsubscribe))
          .subscribe((data: any) => {
            if (data.status) {
              this._snackBar.open(`The assumption has been deleted successfully`, "Success", {
                duration: 3000,
              });
              const rowIndex = this.dataSource.data.findIndex(item => item.rowNumber == row.rowNumber)
              this.dataSource.data.splice(rowIndex, 1);
              this.updateDataSource()
              this.assumptionService.updateProjectAssumption(this.dataSource.data);
              this._spinner.hide("assumption-spinner");
            }
          }), (err: any) => {
            this._spinner.hide("assumption-spinner");
            this._snackBar.open(err, "Failure", {
              duration: 3000,
            });
          }
      }
    })
  }

  updateDataSource() {
    this.dataSource.data = [...this.dataSource.data]
    this.originalDataSource = [...this.dataSource.data]
  }
  updateSingleAssumption(assumption) {
    this.http.patch(this.assumptionUrl, assumption).subscribe(res => { });
  }
  /*triggers when user click highlight option*/
  toggleHighlight(row) {
    row.highlighted = !row.highlighted;
    const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
    const data = { assumption: this.dataSource.data[rowIndex], singleUpdate: true, projectId:this.newDesign.project.id };
    this.assumptionService.updateProjectAssumption(this.dataSource.data);
    this.updateSingleAssumption(data);
  }
  //Open dialog to edit or add a assumption to the database
  openAssumptionDialog(row, type) {
    let lastItemArray = this.dataSource.data.slice(-1)[0];
    if (lastItemArray) {
      row.no = lastItemArray.rowNumber + 1;
    } else {
      row.no = 1
    }
    const dialogRef = this._dialog.open(AddAssumptionDialogComponent, {
      disableClose: true,
      data: { row, type },
      width: "600px"
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this._spinner.show("assumption-spinner");
        let data;
        if (type == 'updated') {
          data = { updated: [res],projectId:this.newDesign.project.id }
        } else {
          delete res._id
          res.projectId = this.newDesign.project.id
          data = { added: [res] ,projectId:this.newDesign.project.id}
        }
        this.http.post(this.assumptionUrl, data).pipe(takeUntil(this.unsubscribe))
          .subscribe((data: any) => {
            if (data.status) {
              this.updateRow(res, type, data);
              this._snackBar.open(`Successfully ${type} assumption`, "Success", {
                duration: 3000,
              });
              this._spinner.hide("assumption-spinner");
            }
          }), (err: any) => {
            this._spinner.hide("assumption-spinner");
            this._snackBar.open(err, "Failure", {
              duration: 3000,
            });
          }
      }
    })
  }

}
