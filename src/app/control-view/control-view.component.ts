import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';
import { AddGoalDialog } from '../dialogues/add-goal-dialog/add-goal.component';
import { ArrOpService } from '../services/arr-op.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { CybersecurityGoalService } from '../services/cybersecurity-goal.service';
import { DesignSettingsService } from '../services/design-settings.service';

@Component({
  selector: 'app-control-view',
  templateUrl: './control-view.component.html',
  styleUrls: ['./control-view.component.css']
})
export class ControlViewComponent implements OnInit {

  displayedColumns: string[] = ['no', 'control', 'action'];
  controlLoading;
  controlSearchLoading;
  public dataSourceControl: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  readonly projectRootUrl = environment.backendApiUrl + "projects";
  confirmToDeleteGoalDialogOptions = {
    title: "",
    message: "Are you sure you want to delete this",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  readonly newDesign = JSON.parse(localStorage.getItem("newDesign"));
  goals: any = [];

  constructor(
    private http: HttpClient, private _spinner: NgxSpinnerService,
    private _confirmDialogService: ConfirmDialogService,
    private dialog: MatDialog, private cybersecurityGoalService: CybersecurityGoalService,
    private arrOpService: ArrOpService,public _editDesignShared: DesignSettingsService
  ) { }

  ngOnInit(): void {
    this._spinner.show();
    this.loadControls();
    this.cybersecurityGoalService.cybersecurityGoal$.subscribe(res=>{
      this.goals = res;
    })
  }

  loadControls() {
    if(this._editDesignShared.projectStatus?.milestoneView==true){
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("find", "control").set("id",this.newDesign.project.id);
      this.http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        if(res){
          this._spinner.hide();
          this.dataSourceControl.data = res.control;
        }
      })
    }else{
      const params = new HttpParams().set("id", this.newDesign.project.id);
      this.http.get(this.projectRootUrl + "/projectControl", { params }).subscribe((res: any) => {
        if (res) {
          this._spinner.hide();
          this.dataSourceControl.data = res;
        }
      })
    }
  }


  addControl(row?) {
    const dialogRef = this.dialog.open(AddGoalDialog, {
      width: "30vw",
      data: {
        type: 'control',
        goalData: row
      }
    });
    dialogRef.afterClosed().subscribe((result) => {

      if (result && row) {
        row.content = result.content;
        this.http.post(this.projectRootUrl + "/projectControl", {data:row, projectId:this.newDesign.project.id}).subscribe((res: any) => {
          if (res) {
            const rowIndex = this.dataSourceControl.data.findIndex(item => item.id == row.id);
            this.dataSourceControl.data[rowIndex].content = result.content;
            const goalIndex = this.goals.findIndex(item=>item.id==this.dataSourceControl.data[rowIndex].id);
            this.goals[goalIndex] = this.dataSourceControl.data[rowIndex];
            this.cybersecurityGoalService.updateCybersecurityGoals(this.goals);
          }
        })
      } else if (result) {
        const control:any = this.cybersecurityGoalService.getEmptyGoal('control');
        control.content = result.content.replace(/\s{2,}/g, ' ').trim(); //Remove extra spaces or empty nbsp from content
        const largestValue = this.dataSourceControl.data[this.dataSourceControl.data.length - 1]
        control.rowNumber = largestValue?.rowNumber + 1;
        if(!control?.rowNumber){
          control.rowNumber = 1;
        }
        control.projectId = this.newDesign.project.id;
        control.libraryId = '';
        this.http.post(this.projectRootUrl + "/projectControl", {data:control, projectId:this.newDesign.project.id}).subscribe((res: any) => {
          if (res) {
            this.dataSourceControl.data.push(control);
            this.dataSourceControl.data = [...this.dataSourceControl.data];
          }
        });
      }
    })
  }

  removeControl(row) {
    this.confirmToDeleteGoalDialogOptions.message = `Are you sure you want to delete this control "${row.content}" ?`
    this.confirmToDeleteGoalDialogOptions.title = `Delete Control ?`
    if (row.content.length >= 120) {// Only display 120 characters of content
      this.confirmToDeleteGoalDialogOptions.message = `Are you sure you want to delete this control "${row.content.slice(0, 120)}..." ?`
    }

    this._confirmDialogService.open(this.confirmToDeleteGoalDialogOptions);
    this._confirmDialogService.confirmed()
      .subscribe(confirmed => {
        if (confirmed) {
          const params = new HttpParams().set("id", row.projectId).set('controlId',row.id);
          this.http.delete(this.projectRootUrl + "/projectControl", { params }).subscribe(res => {
            if (res) {
              const rowIndex = this.dataSourceControl.data.findIndex(item => item.id == row.id);
              const goalIndex = this.goals.findIndex(item=>item.id==this.dataSourceControl.data[rowIndex].id);
              this.goals.splice(goalIndex, 1);
              this.cybersecurityGoalService.updateCybersecurityGoals(this.goals);
              this.dataSourceControl.data.splice(rowIndex, 1);
              this.dataSourceControl.data = [...this.dataSourceControl.data]
            }
          })
        }
      })
  }

  addControlToLibrary(row){
    let ds = Object.assign({}, row); 
    delete ds.projectId;
    delete ds.rowNumber;
    row.goalId = [];
    row.threatId = [];
    row.libraryId = this.arrOpService.genRandomId(20);
    this.http.post(this.projectRootUrl+"/controlLib",{data:ds, projectId:this.newDesign.project.id}).subscribe(res=>{
      if(res){
        // this.dataSourceControl.data = [...this.dataSourceControl.data,res];
      }
    });
  }
}