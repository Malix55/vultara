import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthenticationService, UserProfile } from '../services/authentication.service';
import { VulnerabilityInterface } from 'src/threatmodel/ItemDefinition';
import { NgxSpinnerService } from 'ngx-spinner';
import { VulnerabilityService } from '../services/vulnerability.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteVulnerabilityComponent } from '../dialogues/delete-vulnerability/delete-vulnerability.component';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AddUpdateVulnerabilityDialog } from '../dialogues/add-update-vulnerability/add-update-vulnerability.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationsService } from '../services/notifications.service';
import { DesignSettingsService } from '../services/design-settings.service';
import { VulnerabilityWeaknessLinkDialog } from '../dialogues/vulnerability-link-weakness/vulnerability-weakness-link-dialog.component';

@Component({
  selector: 'app-vulnerabilities',
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.css']
})

export class VulnerabilitiesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('searchInput') input: ElementRef<HTMLInputElement>;
  displayedColumns: string[] = ['no', 'component', 'swhw', 'cveid',
    'publishDate', 'description', 'baseScore', 'treatment', 'reviewed',
    'validated', 'linkedWeaknesses', 'tableOp'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalDataSource: VulnerabilityInterface[] = []
  readonly newDesign = JSON.parse(localStorage.getItem("newDesign"));
  treatments: string[] = ["no treatment", "reduce", "retain", "avoid", "share"];
  currentUserProfile: UserProfile
  searchText: string = ""
  private unsubscribe: Subject<void> = new Subject();
  highlightedItemIndex: any = -1;
  itemIndex: any;
  currentSwitchVal: any = 'sw';
  swbom: any;
  hwbom: any;
  paramsId: any;
  pageNumber: number;
  baseScore: any;
  loaded: boolean = false; //Flag for not running the highlight function twice on initial load
  swPlaceHolder: string = 'SW';
  vulnerabilitiesUrl = `${environment.backendApiUrl}vulnerability/${this.newDesign.project.id}`
  weaknessUrl = `${environment.backendApiUrl}weakness/${this.newDesign.project.id}`

  constructor(private http: HttpClient, private _authService: AuthenticationService, private _dialog: MatDialog,
    private _spinner: NgxSpinnerService, private _vulnerabilityService: VulnerabilityService, private activatedRoute: ActivatedRoute, private router: Router,
    private route: ActivatedRoute, private _snackBar: MatSnackBar, private notificationsService: NotificationsService,
    public editDesignShared: DesignSettingsService
  ) { }
  /*fetch vulnerabilities from backend, convert it to FE model and update data source
    if user is coming from notification component, scroll to that specific vulnerability and highlight it for 8 seconds
  */
  ngOnInit(): void {
    this.getProjectVulnerabilities()

    this._vulnerabilityService.currentaddedIds
      .subscribe(currentData => { //Listening for updates if any new vulnerabilities are added
        if (currentData) {
          this.updateAdded(currentData)
        }
      })
  }

  updateAdded(data) {// update _id of vulnerabilities added to db
    const added = this._vulnerabilityService.addedVulnerabilities
    added.map((item, index) => {
      let vulnerabilityIndex = this.dataSource.data.findIndex(d => item.no == d.no)
      if (vulnerabilityIndex > -1) {
        this.dataSource.data[vulnerabilityIndex]._id = data.resp.insertedIds[index]._id;
        this.dataSource.data[vulnerabilityIndex].isNew = false;
      }
    })
    this._vulnerabilityService.addedVulnerabilities = []
    this._vulnerabilityService.updateAddedIds(null)
  }

  getProjectVulnerabilities() {
    this._spinner.show("vulnerability-spinner");
    localStorage.setItem("intendedUrl", this.router.url);
    this.route.queryParams.subscribe(params => {
      this.paramsId = params.id
      if (this.loaded) {
        //Run highlight function again on params change
        this.highlightRow()
      }
    })

    if (this.editDesignShared.projectStatus?.milestoneView) {//If milestone load data from milestone
      let queryParams = new HttpParams().set("milestoneId", this.newDesign.project.milestoneId).set("find", "vulnerability").set("id",this.newDesign.project.id);
      this.http.get(`${environment.backendApiUrl}milestones/projectMilestoneDb`, { params: queryParams }).subscribe((res: any) => {
        if (res.vulnerability.length) {
          this.dataSource.data = res.vulnerability
          this.dataSource.data.forEach((item, index) => {
            item.no = index + 1
            // item.baseScore=item.baseScore+' '+item.baseSeverity
            item.swhw = `${item?.sbom?.product ?? ''}${item?.sbom?.product && item?.hbom?.product ? '/' : ''}${item?.hbom?.product ?? ''}`
            // item.publishedDate =item.publishedDate?? item.createdAt
            item.publishedDate === null ? item.publishedDate = "" : item.publishedDate = new Date(item.publishedDate);
            const checkDate = item.publishedDate instanceof Date && !isNaN(item.publishedDate.valueOf())
            if (!checkDate) {// If date is an invalid date set it to string
              item.publishedDate = ""
            }
          })
          this.originalDataSource = [...this.dataSource.data]
          this._spinner.hide("vulnerability-spinner");
          this.highlightRow()
          this.loaded = true
        } else {
          this._spinner.hide("vulnerability-spinner");
        }
      })
    } else {
      let params = new HttpParams().set("id", this.newDesign.project.id);
      this.http.get(this.vulnerabilitiesUrl,{params}).pipe(takeUntil(this.unsubscribe))
        .subscribe((data: any[]) => {
          this.dataSource.data = data
          this.dataSource.data.forEach((item, index) => {
            item.no = index + 1
            // item.baseScore=item.baseScore+' '+item.baseSeverity
            item.swhw = `${item?.sbom?.product ?? ''}${item?.sbom?.product && item?.hbom?.product ? '/' : ''}${item?.hbom?.product ?? ''}`
            // item.publishedDate =item.publishedDate?? item.createdAt
            item.publishedDate === null ? item.publishedDate = "" : item.publishedDate = new Date(item.publishedDate);
            const checkDate = item.publishedDate instanceof Date && !isNaN(item.publishedDate.valueOf())
            if (!checkDate) {// If date is an invalid date set it to string
              item.publishedDate = ""
            }
          })
          this.originalDataSource = [...this.dataSource.data]
          this._spinner.hide("vulnerability-spinner");
          this.highlightRow()
          this.loaded = true
        },
          (error) => this._spinner.hide("vulnerability-spinner"),
          () => this._spinner.hide("vulnerability-spinner")
        )
      this.currentUserProfile = this._authService.currentUserValue();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
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
  /*triggers when treatment is changed, updates treatment property of that row*/
  onTreatmentChange(value, row) {
    const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id)
    this.dataSource.data[rowIndex].treatment = value
    const updatedRowIndexInupdatedRows = this._vulnerabilityService.updatedVulnerbilities.findIndex(item => item._id == row._id)
    if (updatedRowIndexInupdatedRows == -1 && !row.isNew) this._vulnerabilityService.updatedVulnerbilities.push(row)
  }
  /*Track by treatment index-value*/
  trackByTreatment(index: number, value: any) {
    return `treatment-${index}-${value}`;
  }

  //Open dialog to edit or add a vulnerability to the database
  openDialog(row,type){
    if(!row.isNotified && type!=="added" && !this.editDesignShared.projectStatus?.milestoneView || this.editDesignShared.projectStatus?.milestoneView == undefined ){ //Change row isNotified to true if its false
    row.isNotified = true;
    const data = {vulnerability:row,singleUpdate:true, projectId:this.newDesign.project.id};
    this.updateSingleVulnerability(data);
    this.notificationsService.readNotificationById({type:"vulnerability",id:row._id});
    }

    if (type == "added") {
      row.vulnerabilitySource = ''
      row.manual = true; //Flag for user added vulnerability
    }

    const dialogRef = this._dialog.open(AddUpdateVulnerabilityDialog, {
      disableClose: true,
      data: { row, type, milestoneView: this.editDesignShared.projectStatus?.milestoneView },
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this._spinner.show("vulnerability-spinner");
        let data;
        if(type == 'updated'){
          data = { updated: true, data:res, projectId:this.newDesign.project.id }
        }else{
          delete res._id
          res.projectId = this.newDesign.project.id
          data = { data: res, added: true, projectId:this.newDesign.project.id  }
        }
        this.http.post(this.vulnerabilitiesUrl,data).pipe(takeUntil(this.unsubscribe))
          .subscribe((data:any) => {
            if(data){
              this.updateRow(res,type,data);
              this._snackBar.open(`Successfully ${type} vulnerability`, "Success", {
                duration: 3000,
              });
              this._spinner.hide("vulnerability-spinner");
            }
          }), (err: any) => {
            this._spinner.hide("vulnerability-spinner");
            this._snackBar.open(err, "Failure", {
              duration: 3000,
            });
          }
      }
    })
  }

  /*converts boolean value of reviewed and validated to yes and no to show on checkboxes*/
  convertBoolToYesNo(rowBooleanVals) {
    return rowBooleanVals ? 'Yes' : 'No'
  }

  /* triggers when user press delete option on any row, opens delete dialog and update row on delete */
  deleteRow(row) {
    const dialogRef = this._dialog.open(DeleteVulnerabilityComponent, {
      width: "500px",
      data: row
    });
    dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe)).subscribe(result => {
      if (result == 'delete') {
        let params = new HttpParams().set("_id", row._id).set("id", this.newDesign.project.id);
        this.removeVulnerabilitiesFromWeaknesses(row);
        this.http.delete(this.weaknessUrl, { params }).pipe(takeUntil(this.unsubscribe)).subscribe(response => { })
        this.http.post(this.vulnerabilitiesUrl, { deleted:true, _id:row._id, projectId:this.newDesign.project.id }).pipe(takeUntil(this.unsubscribe))
          .subscribe((data: any) => {
            if (data) {
              this._snackBar.open(`Successfully deleted vulnerability from database`, "Success", {
                duration: 3000,
              });
              this.notificationsService.readNotificationById({ type: "vulnerability", id: row._id });
              const rowIndex = this.dataSource.data.findIndex(item => item.no == row.no)
              this.dataSource.data.splice(rowIndex, 1)
              this.updateDataSource()
              this._spinner.hide("vulnerability-spinner");
            }
          }), (err: any) => {
            this._spinner.hide("vulnerability-spinner");
            this._snackBar.open(err, "Failure", {
              duration: 3000,
            });
          }
      }
    })
  }

  removeVulnerabilitiesFromWeaknesses(row) {
    const data = row.linkedWeaknesses.map(function (id) {
      return { _id: id, linkedVulnerabilities: row._id};
    });
    const ds = { data, removeVulnerabilities: true, projectId:this.newDesign.project.id };
    this.http.patch(this.weaknessUrl, ds).subscribe(response => { });
  }

  /*triggers when user click highlight option*/
  toggleHighlight(row) {
    row.highlighted = !row.highlighted;
    const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
    const data = { vulnerability: this.dataSource.data[rowIndex], singleUpdate: true, projectId: this.newDesign.project.id};
    this.updateSingleVulnerability(data);
  }
  /*Trigers from delete and add functions to update the data sourse of grid. We have to keep copy of original data
    so that we don't loose data while showing search results.
  */
  updateDataSource() {
    this.dataSource.data = [...this.dataSource.data]
    this.originalDataSource = [...this.dataSource.data]
  }

  updateSingleVulnerability(vulnerability) {
    this.http.patch(this.vulnerabilitiesUrl, vulnerability).subscribe(res => { });
  }

  /*Trigeers when user press toggle buttons below swhw field.*/
  // swhwChanged(event, row){
  // this.currentSwitchVal=event.value
  // if(event.value=="hw"){
  //   row.sbom.product=row.swhw
  //   row.swhw=row.hbom.product
  //   this.swPlaceHolder = 'HW'

  //   }else if(event.value=="sw"){
  //     row.hbom.product=row.swhw
  //     row.swhw=row.sbom.product
  //     this.swPlaceHolder = 'SW'
  //   }
  // }

  /*If switch is not clicked after changing value
   it will not save value in sbom or hbom
   this function detects changeonInput and puts the value
   in sbom or hbom */
  // swValChanged($event,row){
  //   if(this.currentSwitchVal=="sw"){
  //     row.sbom.product=$event
  //   }else if(this.currentSwitchVal=="hw"){
  //     row.hbom.product=$event
  //   }
  //   // this.updateRow(row)
  // }

  goToPage() {
    this.paginator.pageIndex = this.pageNumber, // number of the page you want to jump.
      this.paginator.page.next({
        pageIndex: this.pageNumber,
        pageSize: this.paginator.pageSize,
        length: this.paginator.length
      });
  }

  //Highlights row based on params Id
  highlightRow() {
    let alreadyHighlighted = false;
    if (this.paramsId) {
      this.itemIndex = this.dataSource.data.findIndex(item => item._id == this.paramsId)
      console.log(this.itemIndex);
      if (this.itemIndex > 9) {
        let pageNumber = this.itemIndex.toString()[0];
        this.pageNumber = pageNumber
        this.goToPage()
      }
      if (this.dataSource.data[this.itemIndex].highlighted) { //If row was already highlighted dont remove the highlight
        alreadyHighlighted = true;
      }
      this.dataSource.data[this.itemIndex].highlighted = true
      setTimeout(() => {
        const topOffeset = document.getElementById(this.paramsId).offsetTop;
        document.getElementsByClassName('vulnerability-list-table-container')[0].scrollTo({ top: topOffeset - 100, behavior: 'smooth' })
        this.loaded = true
      }, 0);
    }

    if (this.paramsId && alreadyHighlighted == false) {
      setTimeout(() => {
        this.dataSource.data[this.itemIndex].highlighted = false
        // document.getElementsByClassName('threat-row')[this.itemIndex].className += ' removeBGColor';
        // this.dataSource.data[this.itemIndex].highlighted = false
      }, 8000);
    }
  }

  updateRow(row, type, data) { // get the updated row data and udpate the variable in the service
    if (type == 'updated') {
      const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id)
      this.dataSource.data[rowIndex] = row;
      this.dataSource.data[rowIndex].swhw = `${this.dataSource.data[rowIndex]?.sbom?.product ?? ''}${this.dataSource.data[rowIndex]?.sbom?.product && this.dataSource.data[rowIndex]?.hbom?.product ? '/' : ''}${this.dataSource.data[rowIndex]?.hbom?.product ?? ''}`;
    } else {
      row._id = data._id
      row.linkedWeaknesses = [];
      row.no = this.dataSource.data.length + 1
      row.swhw = `${row?.sbom?.product ?? ''}${row?.sbom?.product && row?.hbom?.product ? '/' : ''}${row?.hbom?.product ?? ''}`;
      this.dataSource.data.push(row);
    }
    this.updateDataSource()
    this.dataSource.paginator = this.paginator; // Refreshes current page so data is updated
  }

  linkWeaknesses(row) {
    const dialogRef = this._dialog.open(VulnerabilityWeaknessLinkDialog, {
      disableClose: true,
      width: '95%',
      maxWidth: '100vw',
      data: { row }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.http.patch(this.weaknessUrl, res).subscribe(respons => { });
        this.http.patch(this.vulnerabilitiesUrl, res).subscribe(response => { });
        const rowIndex = this.dataSource.data.findIndex(item => item._id == row._id);
        this.dataSource.data[rowIndex].linkedWeaknesses = res.vulnerabilityData.linkedWeaknesses;
        this.updateDataSource();
      }
    })
  }
}
