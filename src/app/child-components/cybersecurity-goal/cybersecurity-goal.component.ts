import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil,filter } from 'rxjs/operators';
import { CybersecurityGoalDialogComponent } from 'src/app/dialogues/cybersecurity-goal/cybersecurity-goal.component';
import { CybersecurityGoalService } from 'src/app/services/cybersecurity-goal.service';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { environment } from 'src/environments/environment';
import { CybersecurityGoal } from 'src/threatmodel/ItemDefinition';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ArrOpService } from 'src/app/services/arr-op.service';

@Component({
  selector: 'app-cybersecurity-goal-section',
  templateUrl: './cybersecurity-goal.component.html',
  styleUrls: ['./cybersecurity-goal.component.css']
})
export class CybersecurityGoalSectionComponent implements OnChanges, OnInit, OnDestroy {
  @Input() threatId: string = "";
  @Input() type: string;

  readonly projectRootUrl = environment.backendApiUrl + "projects";

  public displayedColumns: string[] = ['serial', 'goal'];
  public cybersecurityGoalList: CybersecurityGoal[] = [];
  public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  private unsubscribe: Subject<void> = new Subject<void>();
  readonly rootUrl = environment.backendApiUrl + "projects";
  projectGoals;
  loadedGoals:any=[];
  newGoalAdded: any;
  projectId: string = this.editDesignShared.getProjectProperty("id");
  allData: any;
  currentUrl: string;


  constructor(
    public dialog: MatDialog,
    public editDesignShared: DesignSettingsService,
    private http: HttpClient,
    private cybersecurityGoalService: CybersecurityGoalService,
    private _router:Router,
    private arrOpService: ArrOpService,

  ) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'threatId':
            this.getCybersecurityGoalsById(this.threatId);
            break;
        }
      }
    }
  }

  ngOnInit(): void {
    this._router.events.pipe(filter(event => event instanceof NavigationStart))
    .subscribe((res:any)=>{
      this.currentUrl = res.url
    })
    
    this.initCybersecurityGoals();
    let queryParams = new HttpParams().set("id",this.projectId);
    const cybersecurityGoals$ = this.http.get(this.rootUrl + "/cybersecurityGoals", { params: queryParams });
    cybersecurityGoals$.pipe(takeUntil(this.unsubscribe))
    .subscribe((res:any)=>{
      //Stored loadedGoals from db 
      this.loadedGoals=res.goal;
      
    })

    this.cybersecurityGoalService.updatedGoalId$.subscribe(res=>{
      if(res){
        this.addGoalIds();
        this.cybersecurityGoalService.updateGoalId.next(false);
      }
    })
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Subscribe for new goals and update table information
  private initCybersecurityGoals() {
    this.cybersecurityGoalService.cybersecurityGoal$.pipe(takeUntil(this.unsubscribe)).subscribe((_: CybersecurityGoal[]) => {
        this.cybersecurityGoalList = this.cybersecurityGoalService.getCybersecurityGoalsById(this.threatId,this.type);
        this.dataSource.data = this.cybersecurityGoalList;
        this.allData = _;
    })
  }

  // Get goals information of a specific threat
  private getCybersecurityGoalsById(threatId: string) {
    this.cybersecurityGoalList = this.cybersecurityGoalService.getCybersecurityGoalsById(threatId,this.type);
  }

  // Create new goal via adding information to popup input field. initially it'll create "New Goal" option for creating new one
  public addCybersecurityGoal() {

    //checking if there are locally added goal not yet saved to db
    if(this.cybersecurityGoalService.localGoal.length){
      this.cybersecurityGoalService.localGoal.forEach(item=>{
        this.cybersecurityGoalList.push(item)
      })
    }

    //If cybersecurityGoalList does not contain loadedGoals add them
    if(!this.cybersecurityGoalList.includes(this.loadedGoals)){
      this.loadedGoals.forEach(item=>{
        this.cybersecurityGoalList.push(item)
        })
      this.cybersecurityGoalList= this.cybersecurityGoalList.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    }
    
    
    // if(!this.cybersecurityGoalList.length){
    //   this.cybersecurityGoalList=this.loadedGoals ?? this.cybersecurityGoalList; //If loadedGoals is undefined then dont assign it
    // }

    const data: any = {
      threatId: this.threatId,
      goalId: "0",
      content: "",
      goals: this.cybersecurityGoalList,
      type: this.type
    };

    this.cybersecurityGoalPopUp(data);
  }

  // Update a goal via selecting from existing list
  public updateCybersecurityGoal(goalId: string, content: string, libraryId) {
    this.getCybersecurityGoalsById(this.threatId)
    const data: any = {
      threatId: this.threatId,
      goalId,
      content,
      libraryId,
      goals: this.cybersecurityGoalList,
      type: this.type
    };

    this.cybersecurityGoalPopUp(data,'update');
  }

  // Open cybersecurity goal popup to create/update/delete goal
  private cybersecurityGoalPopUp(data: any = {},update?) {

    this.cybersecurityGoalService.cybersecurityGoal$.subscribe(res=>{ //Get latest goals
      data.goals = res
    })
    
    if(update){ //If a goal is clicked only show goals added to that threat
      data.goals = data.goals.filter(item=>{
        if(item.threatId.includes(this.threatId)){
          return item
        }
      })
    }
    const mode = update?'Edit':'Add'
    data.mode = mode;
    data.goals = data.goals.filter(item=>item.type == this.type);
    const dialogRef = this.dialog.open(CybersecurityGoalDialogComponent, {
      minWidth: "500px",
      disableClose: true,
      data,
      autoFocus:false,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((_: any) => {
        if (_?.data && _.data.type!=='control' && !_.controlDeleted) {
          this.addGoalIds();
          this.cybersecurityGoalService.localGoal=this.cybersecurityGoalService.localGoal.filter(item=>item.id!==_.data.id);
          this.cybersecurityGoalService.localGoal.push(_.data);
        }else if(_?.data?.type=='control'){
            _.data.categoryId = this.arrOpService.genRandomId(20);
            _.data.categoryName = '';
            _.data.name = '';
            _.data.description = '';
            _.data.goalId = this.allData.filter(item=>item.type=='goal'&&item.threatId.includes(this.threatId)).map(item=>item._id).filter(Boolean);
            _.data.projectId = this.projectId;
            this.http.post(this.rootUrl + "/projectControl", {data:_.data, projectId:this.projectId}).subscribe((res:any)=>{
              // if(res.upsertedId){
              //   const index = this.allData.findIndex(item=>item.id == res.id);
              //   this.allData[index]._id = res.upsertedId;
              //   this.cybersecurityGoalService.updateCybersecurityGoals(this.allData);
              // }
            })
        }else if(_?.removed){
          this.removeGoalId(_.goalId)
        }else if(_?.controlDeleted){
          const delIndex = this.allData.findIndex(item=>item.id==_.goalId);
          const goalsLinked = this.allData.filter(item=>item.type=='goal' && item.threatId.includes(this.threatId)).map(item=>item._id);
          this.allData[delIndex].goalId = this.allData[delIndex].goalId.filter( ( el ) => !goalsLinked.includes( el ) );
          
          
          // _.data.threatId = _.data.threatId.filter(item=>item!==this.threatId);
          this.http.post(this.rootUrl + "/projectControl", {data:this.allData[delIndex], projectId:this.projectId}).subscribe((res:any)=>{
            // if(res.upsertedId){
            //   const index = this.allData.findIndex(item=>item.id == res.id);
            //   this.allData[index]._id = res.upsertedId;
            //   this.cybersecurityGoalService.updateCybersecurityGoals(this.allData);
            // }
          })
        }
      });
    }

    addGoalIds(){
      const ids = this.allData.filter(item=>item.type=='goal'&&item.threatId.includes(this.threatId)).map(item=>item._id).filter(Boolean);
      this.allData.forEach((item:any)=>{
        if(item.type=='control' && item.threatId.includes(this.threatId)){
          item.goalId = ids
        }
      })
      const controls = this.allData.filter(item=>item.type=='control'&&item.threatId.length);
      this.http.patch(this.rootUrl + "/projectControl", {controls,goalId:true,projectId:this.projectId}).subscribe((res:any)=>{})
      this.cybersecurityGoalService.updateCybersecurityGoals(this.allData);
    }

    removeGoalId(id){
      this.allData.forEach((item:any)=>{
        if(item.type=='control'){
          const index = item.goalId.indexOf(id);
          item.goalId.splice(index,1);
        }
      })
      // const controls = this.allData.filter(item=>item.type=='control'&&item.threatId.includes(this.threatId));
      // this.http.patch(this.rootUrl + "/projectControl", {controls,goalId:true}).subscribe((res:any)=>{})
      this.cybersecurityGoalService.updateCybersecurityGoals(this.allData);
    }


}
