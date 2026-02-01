import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { ArrOpService } from 'src/app/services/arr-op.service';
import { ConfirmDialogService } from 'src/app/services/confirm-dialog.service';
import { CybersecurityGoalService } from 'src/app/services/cybersecurity-goal.service';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { environment } from 'src/environments/environment';
import { CybersecurityGoal } from 'src/threatmodel/ItemDefinition';

@Component({
  selector: 'app-cybersecurity-goal-dialog',
  templateUrl: './cybersecurity-goal.component.html',
  styleUrls: ['./cybersecurity-goal.component.css']
})
export class CybersecurityGoalDialogComponent implements OnInit {
  libraryDuplicate: boolean = false; // flag for a duplicate goal being added
  constructor(
    private dialogRef: MatDialogRef<CybersecurityGoalDialogComponent>,
    private cybersecurityService: CybersecurityGoalService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private _snackBar: MatSnackBar,public _editDesignShared: DesignSettingsService,
    private arrOpService: ArrOpService, private _confirmDialogService: ConfirmDialogService
  ) { }

  loadedGoal: any;
  selectedGoal: any;
  isLoadng: boolean = false;
  searchResults = []
  readonly projectRootUrl = environment.backendApiUrl + "projects";
  filteredGoals:Observable<any[]>;
  searchValue:FormControl = new FormControl()
  goals = [...this.data.goals,{content:"Search in library",id:"1"}]
  libSearch:boolean = false;
  confirmToCancel = {
    title: "CONFIRMATION",
    message: "Are you sure you want to delete this control?",
    cancelText: "Cancel",
    confirmText: "Delete",
  };
  
  ngOnInit(): void {
    if(this.data.type=="goal"){
      this.goals.unshift({content:"New Goal",id:"0"})
    }else if(this.data.type=="claim"){
      this.goals.unshift({content:"New Claim",id:"0"})
    }else if(this.data.type=="control"){
      this.goals.unshift({content:"New Control",id:"0"})
    }
    //Call the filter function to search using the keywords
    this.filteredGoals = this.searchValue.valueChanges.pipe(
      startWith(<string>null),
      debounceTime(400),
      tap((res) => {
        if (res == ""){
           this.data.content = "";
        }
        if (this.libSearch && res !== ""){
           this.isLoadng = true;
        }
      }),
      switchMap((val) => {
        if (this.libSearch && val == ""){
           return of([]).pipe(
            finalize(() => {
              this.isLoadng = false;
            })
          );
        }
        return this.filter(val || "").pipe(
          finalize(() => {
            this.isLoadng = false;
          })
        );
      })
    );
    let data = this.data.content == "" ? this.goals[0] : {content:this.data.content,id:this.data.goalId}
    this.loadedGoal = data
    this.searchValue.setValue({content:data,id:this.data.goalId});
    
  }

  // filter and return the values
  filter(val): Observable<any[]> {
    let searchWord = val.content || val
    // call the service which makes the http-request
    return this.searchGoals()
    .pipe(
      map(response => response.filter(goal => { 
        return goal.content.toLowerCase().includes(searchWord.toLowerCase());
      }))
    )
  }  
  
  displayGoal(goal) {
    return goal ? goal.content : '';
  }

  public closeCybersecurityGoalDialog($event: any) {
    $event.preventDefault();
    this.dialogRef.close();
  }

  // Remove a goal from goals observable
  removeGoal() {
    if (this.data.goalId !== "0" && this.data.type !=='control') {
      this.cybersecurityService.removeCybersecurityGoalById(this.data.threatId, this.data.goalId);
      this.dialogRef.close({removed:true,goalId:this.data.goalId});
    }else if(this.data.goalId !== "0" && this.data.type =='control'){
      this._confirmDialogService.open(this.confirmToCancel);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      if (confirmed) {
        this.cybersecurityService.removeCybersecurityGoalById(this.data.threatId, this.data.goalId);
        this.dialogRef.close({controlDeleted:true,goalId:this.data.goalId});
      }
    })
    }
  }

  // Confirm create/update goal
  confirmGoal() {
    let duplicate = false
    let currentGoals=[]
    if(this.data.goalId!=='0'){ //Get the currentGoals from observable
      this.cybersecurityService.cybersecurityGoal$.subscribe(res=>{
      currentGoals=res;
      })
      if(this.libraryDuplicate||this.libSearch){ //If the goal is added from the library then remove Id and update some properties
        const largestValue: number = this.cybersecurityService.getLargestRowNumber(this.data.type);
        delete this.selectedGoal._id
        this.selectedGoal.rowNumber = largestValue + 1
        this.selectedGoal.createdBy=this.cybersecurityService.currentUserProfile._id
        if(this.libraryDuplicate){
          this.selectedGoal.id = this.arrOpService.genRandomId(20)
        }
        this.selectedGoal.threatId = []
      }
      let currentGoalIndex  = currentGoals.findIndex(item=>item.id==this.data.goalId)

      if(this.libSearch){ //Checks for duplicate goals
        duplicate = currentGoals.some(item => item.content === this.selectedGoal.content);
      }else{
        if(currentGoals[currentGoalIndex]?.threatId.includes(this.data.threatId)){
          duplicate = currentGoals.filter(e => e.content === currentGoals[currentGoalIndex].content).length > 1 && false
        }
      }

    if(!duplicate){ //If goal is not a duplicate then add
      if(this.libSearch||this.libraryDuplicate){
        currentGoals.push(this.selectedGoal)
      }
    
      let objIndex;
      if(this.libraryDuplicate){
        objIndex = currentGoals.findIndex((obj => obj.id == this.selectedGoal.id));
      }else{
        objIndex = currentGoals.findIndex((obj => obj.id == this.data.goalId));
      }
      currentGoals[objIndex].threatId.push(this.data.threatId)

      if(this.libSearch){
        currentGoals[objIndex].threatId = currentGoals[objIndex].threatId.filter(item=>item==this.data.threatId)
      }

      currentGoals[objIndex].threatId = [...new Set(currentGoals[objIndex].threatId)]
    }
  }
    if(this.data.content !== "" && !duplicate){
      let threatId;
      let goalId;
      let content;
      if(this.libraryDuplicate){
        threatId = this.data.threatId;
        goalId = this.selectedGoal.id;
        content = this.data.content;
      }else{
        threatId = this.data.threatId;
        goalId = this.data.goalId;
        content = this.data.content;
      }

      const libraryId = this.selectedGoal?.libraryId ?? this.data.libraryId;
      const goal = this.cybersecurityService.updateCybersecurityGoal(threatId, goalId, content, libraryId, this.data.type);
      this.dialogRef.close({ data: goal });
    }
  }

  // Event listener callback for goal selection change
  public onGoalChange(goalId) {
    this.selectedGoal = goalId.source.value
    if(goalId.source.value.content=="Search in library"){ //Change ui to search library
      this.changeSearch(true) 
    }else{
    if (goalId.source.value.id !== "0") { // Check if a new goal is being added
      const goal: CybersecurityGoal = this.data.goals.find((_: CybersecurityGoal) => _.id === goalId.source.value.id);
      // if (goal) {
        this.data.goalId = goalId.source.value.id;
        this.data.content = goalId.source.value.content;
      // }
      if(this.libSearch && this.data.goals.some(item => item.id === this.data.goalId)){
        this.changeSearch(false) 
        this.libraryDuplicate = true
        this.loadedGoal = goalId.source.value
      }
    } else {
      this.changeSearch(false) 
      this.data.goalId = "0";
      this.data.content = "";
    }
  }
}

  //Change search from project goals to organization goals
  changeSearch(val){
    this.libSearch = val
    this.searchValue.setValue('');
  }


  //Search goals from database
  searchGoals(){
    if(this.libSearch){
      let search = this.searchValue.value
      let queryParams = new HttpParams().set("search",search).set("type",this.data.type)
      //If user clicks on a goal or if goal search is empty dont search the db
      if(search instanceof Object || !search.trim()){
        if(!this.libSearch){
          return of(this.goals)
        }
        return of([])
      }else{
        if(this.data.type!=='control'){
          return this.http.get<any>(this.projectRootUrl+'/cybersecurityGoalsLibrary',{ params: queryParams}).pipe(tap(data => {
            if(!data[0].id){
              this._snackBar.open(data[0].content, "", {
                duration: 3000,
              });
            }
            return this.searchResults = data
          }))
        }else{
          let params = new HttpParams().set("search", search);
          return this.http.get<any>(this.projectRootUrl + '/controlLib', { params: queryParams }).pipe(tap(data => {
            if (!data[0].id) {
              this._snackBar.open(data[0].content, "", {
                duration: 3000,
              });
            }else{
                return this.searchResults = data;
            }
          }))
        }
      }
    }else{
      return of(this.goals)
    }
  }
  
  compareObjects(o1: any, o2: any): boolean {
    return o1.content === o2.content && o1.id === o2.id;
  }
}