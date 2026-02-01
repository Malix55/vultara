import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, of, Subject } from 'rxjs';
import { Router,NavigationStart} from '@angular/router';
import { takeUntil, filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CybersecurityGoal } from 'src/threatmodel/ItemDefinition';
import { AddGoalDialog } from '../dialogues/add-goal-dialog/add-goal.component';
import { ArrOpService } from '../services/arr-op.service';
import { CybersecurityGoalService } from '../services/cybersecurity-goal.service';
import { DesignSettingsService } from '../services/design-settings.service';
import { debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

@Component({
  selector: 'app-cybersecurity-goal',
  templateUrl: './cybersecurity-goal.component.html',
  styleUrls: ['./cybersecurity-goal.component.css']
})
export class CybersecurityGoalComponent implements OnInit, OnDestroy {
  @Input() library:boolean; // Flag for checking if component is loaded from library view
  public dataSourceGoal: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  public dataSourceClaim: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  public displayedColumns: string[] = ['serial', 'goal', 'action'];
  private unsubscribe: Subject<void> = new Subject<void>();
  public goals: CybersecurityGoal[] = [];
  readonly projectRootUrl = environment.backendApiUrl + "projects";
  libraryGoals: any = [];
  loading: boolean = false;
  projectId = this.editDesignShared.getProjectProperty("id");
  searchValue:FormControl = new FormControl()
  filteredGoals: any;
  searchType: any = 'goal';
  searchLoading:boolean = false;
  currentUrl:string;
  confirmToDeleteGoalDialogOptions = {
    title: "",
    message: "Are you sure you want to delete this",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };

  constructor(
    private cybersecurityGoalService: CybersecurityGoalService,
    private router: Router,
    public editDesignShared: DesignSettingsService,
    private http: HttpClient,
    private _snackBar: MatSnackBar,
    private arrayOp: ArrOpService,
    private _spinner: NgxSpinnerService,
    private dialog: MatDialog,
    private _confirmDialogService: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    let queryParams = new HttpParams().set("limit","40");
    localStorage.setItem("intendedUrl", this.router.url);
    if(this.library){// If component is loaded in library view load library goals
      this.loading = true;
      this.http.get<any>(this.projectRootUrl+'/cybersecurityGoalsLibrary',{ params: queryParams}).subscribe(res=>{
        this.libraryGoals = res ?? []
        this.cybersecurityGoalService.updateCybersecurityLibraryGoals(this.libraryGoals);
        this.initCybersecurityGoals();
      })
    }else{
      this.initCybersecurityGoals()
    }

    if(this.library){// Search as you type for goal library tab
      this.searchValue.valueChanges.pipe(
        startWith(<string>null),
        debounceTime(400),
        switchMap((val) => {
          return this.filter(val || "").pipe(
            finalize(() => {
              this.searchLoading = false;
            })
            );
          })
          ).subscribe();
    }
    this.router.events.pipe(filter(event => event instanceof NavigationStart))
    .subscribe((res:any)=>{
      this.currentUrl = res.url
    })
    
  }


  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    if(!this.library){
      this.goals=this.goals.filter(item=>item.content.length!==0);
      this.cybersecurityGoalService.updateCybersecurityGoals(this.goals);
    }
  }

  filter(val): Observable<any[]> {
    let searchWord = val
    // call the service which makes the http-request
    return this.searchGoals()
    .pipe(
      map(response => response.filter(goal => { 
        return goal.content.toLowerCase().includes(searchWord.toLowerCase());
      }))
    )
  }
  
  //Search backend for goals with provided text
  searchGoals() {
    this.searchLoading = true;
    let search = this.searchValue.value
    let queryParams = new HttpParams().set("search", search).set("type", this.searchType)
    if(search !== null){
      if(!search.trim().length || search==""){
        this.initCybersecurityGoals()
        return of([])
      }
      return this.http.get<any>(this.projectRootUrl + '/cybersecurityGoalsLibrary', { params: queryParams }).pipe(tap(data => {
        if (!data[0].id) {
          this._snackBar.open(data[0].content, "", {
            duration: 3000,
          });
        }else{
          if(this.searchType=='goal'){
            return this.dataSourceGoal.data = data;
          }else{
            return this.dataSourceClaim.data = data;
          }
        }
      }))
    }else{
      return of([]);
    }
    
  }

  searchTypeChanged(type){
    this.searchValue.patchValue("")
    if(type.index==1){
      this.searchType = 'claim';
    }else{
      this.searchType = 'goal';
    }
  }

  // Subscribe for new cybersecurity goals
  private initCybersecurityGoals() {
      this.cybersecurityGoalService.cybersecurityGoal$.pipe(takeUntil(this.unsubscribe)).subscribe((_: CybersecurityGoal[]) => {
        if (_) {
          this.goals = _;
          this.dataSourceGoal.data = _.filter(item=>item.type=='goal');
          this.dataSourceClaim.data = _.filter(item=>item.type=='claim');
        }  
      })

      if(this.library){//If in library tab subscribe to libraryGoals$ observable
        this.cybersecurityGoalService.cybersecurityLibraryGoal$.pipe(takeUntil(this.unsubscribe)).subscribe((libGoals: CybersecurityGoal[]) => {
          this.dataSourceGoal.data = libGoals.filter(item=>item.type=='goal');
          this.dataSourceClaim.data = libGoals.filter(item=>item.type=='claim');
          this.loading = false;
      })
    }
  }

  // Remove a goal from observable
  public removeGoal(goalId: string, type, content) {
    this.confirmToDeleteGoalDialogOptions.message = `Are you sure you want to delete this ${type} "${content}" ?`
    this.confirmToDeleteGoalDialogOptions.title = `Delete ${type} ?`
    if(content.length >= 120){// Only display 120 characters of content
      this.confirmToDeleteGoalDialogOptions.message = `Are you sure you want to delete this ${type} "${content.slice(0,120)}..." ?`
    }

    this._confirmDialogService.open(this.confirmToDeleteGoalDialogOptions);
    this._confirmDialogService.confirmed()
    .subscribe(confirmed=>{
      if(confirmed){
        let index;
        if(this.library){
          index = this.libraryGoals.findIndex(item=>item.id == goalId);
        }else{
          index = this.goals.findIndex(item=>item.id == goalId);
        }
        this.cybersecurityGoalService.localGoal.splice(index,1)
        if(type=='goal'){
          const sourceIndex = this.dataSourceGoal.data.findIndex(item=>item.id == goalId)
          this.dataSourceGoal.data.splice(sourceIndex,1);
        }else{
          const sourceIndex = this.dataSourceClaim.data.findIndex(item=>item.id == goalId)
          this.dataSourceClaim.data.splice(sourceIndex,1);
        }
    
        if(this.library){// If in library tab delete goal from goal library db as well
          this.libraryGoals.splice(index,1)
          this.cybersecurityGoalService.updateCybersecurityLibraryGoals(this.libraryGoals);
          let queryParams = new HttpParams().set("id", goalId).set("type",type);
          this.http.delete(this.projectRootUrl + "/cybersecurityGoalsLibrary", { params: queryParams }).pipe(takeUntil(this.unsubscribe)).subscribe((res:any) => { 
            if(res){
              this._snackBar.open(res.msg, "", {
                duration: 3000,
              })
              if(this.dataSourceGoal.data.length==0 && type=="goal"){
                this.refreshGoals('goal');
              }else if(this.dataSourceClaim.data.length==0 && type=="claim"){
                this.refreshGoals('claim');
              }
            }
          })
        }else{
          this.goals.splice(index,1)
          this.cybersecurityGoalService.updateCybersecurityGoals(this.goals);
        }
      }
    })

  }

  // Update goal content when input field is updated
  public changeGoalContent($event: any, goalId: string) {
    const goals: CybersecurityGoal[] = this.goals.map((_: CybersecurityGoal) => {
      if (_.id === goalId) {
        _.content = $event;
      }

      return _;
    });

    this.cybersecurityGoalService.updateCybersecurityGoals(goals);
  }

  // Add new goal to observable to specific index
  public addNewGoal(type) {
    const goal: CybersecurityGoal = this.cybersecurityGoalService.getEmptyGoal(type);
      this.goals.push(goal);
      this.cybersecurityGoalService.updateCybersecurityGoals(this.goals);
      if(goal.content.length){
        this.cybersecurityGoalService.localGoal.push(goal)
      }
    
  }

  // Add goal to library and update the goal property libraryId in projectGoal collection
  addGoalToLibrary(index,type){
    let data;
    let addedFromLibrary = false;
    if(type=="goal"){
      data = this.dataSourceGoal.data[index]
    }else if(type=="claim"){
      data = this.dataSourceClaim.data[index]
    }else{// If goal is being added from lib tab
      data = type;
      addedFromLibrary = true;
    }
    const project = { id: this.projectId, addedFromLibrary };
    data.libraryId = this.arrayOp.genRandomId(20);
      this.http.post(this.projectRootUrl + "/cybersecurityGoalsLibrary", { goal:data,project}).pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if(res){
          this._snackBar.open(res.msg, "", {
            duration: 3000,
          })
          if(addedFromLibrary){// update rowNumber if goal added from library tab
            if(data.type=='claim'){
              this.dataSourceClaim.data[0].rowNumber = res.goal.rowNumber;
            }else{
              this.dataSourceGoal.data[0].rowNumber = res.goal.rowNumber;
            }
          }
          this._spinner.hide()
          if(!addedFromLibrary){// update local storage if goal added from goal view
            let ds = JSON.stringify(this.goals);
            localStorage.setItem("goal",ds);
          }
        }
      });
      if(!addedFromLibrary){// update projectGoal db if goal is added to library from goal view
        this.http.patch(this.projectRootUrl + "/cybersecurityGoals",{goal:data, projectId:project.id}).pipe(takeUntil(this.unsubscribe))
        .subscribe(res=>{})
      }
  }


  openGoalDialog(type,goalData?){
    const dialogRef = this.dialog.open(AddGoalDialog, {
      width: "30vw",
      data: {
        type,
        goalData
      }
    });
    dialogRef.afterClosed().subscribe(res=>{
      if(res && !goalData){// If new goal is added to library from library tab
        this._spinner.show()
        const goal: CybersecurityGoal = this.cybersecurityGoalService.getEmptyGoal(type);
        goal.content = res.content.replace(/\s{2,}/g, ' ').trim(); //Remove extra spaces or empty nbsp from content
        delete goal.rowNumber
        this.libraryGoals.unshift(goal);
        this.cybersecurityGoalService.updateCybersecurityLibraryGoals(this.libraryGoals);
        this.addGoalToLibrary(0,goal);
      }
      if(res && goalData){// If existing library goal is being updated from the library tab
        const index = this.libraryGoals.findIndex(item => item.id == goalData.id);
        this.libraryGoals[index].content = res.content.replace(/\s{2,}/g, ' ').trim();
        this.cybersecurityGoalService.updateCybersecurityLibraryGoals(this.libraryGoals);
        this.http.patch(this.projectRootUrl + "/cybersecurityGoalsLibrary", { goal:this.libraryGoals[index]}).pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          if(res){
            this._snackBar.open(res.msg, "", {
              duration: 3000,
            })
          }
        }); 
      }
    })
  }

  //Load all goals for goals tab or claims tab in library view
  loadAllGoals(type){
    this.searchValue.patchValue("")
    const skip = type == 'goal' ? this.libraryGoals.filter(goal => goal.type=='goal').length : this.libraryGoals.filter(goal => goal.type=='claim').length;
    let queryParams = new HttpParams().set("limit","0").set("type",type).set("skip",skip.toString());
    this.loading = true;
    this.http.get<any>(this.projectRootUrl + '/cybersecurityGoalsLibrary',{ params: queryParams}).subscribe(res => {
      if(res?.length){
        this.libraryGoals.push(...res)
        this.cybersecurityGoalService.updateCybersecurityLibraryGoals(this.libraryGoals);
        let goalLength = this.libraryGoals.filter(item => item.type == 'goal').length;
        let claimLength = this.libraryGoals.filter(item => item.type == 'claim').length;
        if (this.searchType == 'claim') {
        this._snackBar.open(
        `All ${claimLength} ${type}s in your ${type} library are shown.`,
              "",
              {
                duration: 5000,
              }
            );  
        } else {
        this._snackBar.open(
        `All ${goalLength} ${type}s in your ${type} library are shown.`,
              "",
              {
                duration: 5000,
              }
            );  
        }
      }else{
        this.loading = false;
      }
    })
  }

  //Refresh current goals or claims with the intial data
  refreshGoals(type){
    this.loading = true;
    let queryParams = new HttpParams().set("limit","40").set("types",type).set("refresh","true");
    this.http.get<any>(this.projectRootUrl+'/cybersecurityGoalsLibrary',{ params: queryParams})
    .subscribe(res=>{
      if(res?.length){
        this.libraryGoals = this.libraryGoals.filter(item=>item.type!==type);
        this.libraryGoals = [...this.libraryGoals,...res];
        this.cybersecurityGoalService.updateCybersecurityLibraryGoals(this.libraryGoals);
        this.loading = false;
      }else{
        this.loading = false;
      }
    })
  }

  
}
