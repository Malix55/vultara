import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { CybersecurityGoal } from 'src/threatmodel/ItemDefinition';
import { ArrOpService } from './arr-op.service';
import { AuthenticationService, UserProfile } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class CybersecurityGoalService {
  private goals: BehaviorSubject<CybersecurityGoal[]> = new BehaviorSubject([]);
  public cybersecurityGoal$ = this.goals.asObservable();
  private libraryGoals: BehaviorSubject<CybersecurityGoal[]> = new BehaviorSubject([]);
  public cybersecurityLibraryGoal$ = this.libraryGoals.asObservable();
  public currentUserProfile: UserProfile = this.authService.currentUserValue();
  public localGoal=[];//goals added but not yet saved to the db
  public removedControls = [];
  public updateGoalId = new BehaviorSubject(false);
  public updatedGoalId$ = this.updateGoalId.asObservable();

  constructor(
    private arrOpService: ArrOpService,
    private authService: AuthenticationService
  ) { }

  // Update goals observable
  public updateCybersecurityGoals(list: CybersecurityGoal[] = []) {
    this.goals.next(list);
  }

  // Update library goals observable
  public updateCybersecurityLibraryGoals(list: CybersecurityGoal[] = []) {
    this.libraryGoals.next(list);
  }

  // Get a cybersecurity goal by given id
  public getCybersecurityGoalsById(threatId: string, type:string) {
    return this.goals.value ? this.goals.value.filter((_: CybersecurityGoal) => _.threatId.includes(threatId) && _.type==type) : [];
  }

  // Update/create cybersecurity goals observable and return the new/updated goal
  public updateCybersecurityGoal(threatId: string, goalId: string, content: string, libraryId, type) {
    let libId = libraryId
    let goal;
    if (goalId === "0") {
      goal = this.defaultGoal(threatId, content, type);
      this.goals.next([...(this.goals.value ? this.goals.value : []), goal]);
    } else {
      const goals: CybersecurityGoal[] = this.goals.value ? this.goals.value : [];
      const threatGoal: CybersecurityGoal = goals.find((_: CybersecurityGoal) => _.threatId.includes(threatId) && _.id === goalId);
      const index: number = goals.findIndex((_: CybersecurityGoal) => _.id === threatGoal.id);

      if (index > -1) {
        goals[index] = {
          ...goals[index],
          content,
          lastModifiedAtDateTime: moment(),
          lastModifiedBy: this.currentUserProfile._id,
          libraryId: libId
        }
        goal = goals[index];
      }
      this.goals.next(goals);
    }
    return goal;
  }

  // This fucntion is not used anywhere
  // Get updated/created goal object from user input
  // public getUpdatedCybersecurityGoal(threatId: string, goalId: string, content: string) {
  //   if (goalId === "0") {
  //     const goal: CybersecurityGoal = this.defaultGoal(threatId, content);
  //     return goal;
  //   } else {
  //     const goals: CybersecurityGoal[] = this.goals.value ? this.goals.value : [];
  //     const threatGoal: CybersecurityGoal = goals.find((_: CybersecurityGoal) => _.threatId.includes(threatId) && _.id === goalId);
  //     return threatGoal;
  //   }
  // }

  // Remove a cybersecurity goal from observable by given id
  public removeCybersecurityGoalById(threatId: string, goalId: string) {
    const goals: CybersecurityGoal[] = this.goals.value;
    const threatGoal: CybersecurityGoal = goals.find((_: CybersecurityGoal) => _.threatId.includes(threatId) && _.id === goalId);
    const index: number = goals.findIndex((_: CybersecurityGoal) => _.id === threatGoal.id);
    if (index > -1) {
      let cd= goals[index].threatId.filter(item=>item!==threatId)
      goals[index].threatId=cd      
      this.goals.next(goals);
    }
  }

  // Create default goal object
  public defaultGoal(threatId: string, content: string, type:string) {
    const largestValue: number = this.getLargestRowNumber(type);
    return {
      id: this.arrOpService.genRandomId(20),
      rowNumber: largestValue + 1,
      createdBy: this.currentUserProfile._id,
      createdAtDateTime: moment(),
      content,
      threatId: [threatId],
      libraryId:"",
      type
    }
  }

  // Create an empty cybersecurity goal
  public getEmptyGoal(type:string): any {
    const largestValue: number = this.getLargestRowNumber(type);
    if (type !== 'control') {
    return {
      id: this.arrOpService.genRandomId(20),
      rowNumber: largestValue + 1,
      createdBy: this.currentUserProfile._id,
      createdAtDateTime: moment(),
      content: "",
      threatId: [],
      libraryId:"",
      type
      }
    } else {
      return {
        id: this.arrOpService.genRandomId(20),
        rowNumber: largestValue + 1,
        createdBy: this.currentUserProfile._id,
        createdAtDateTime: moment(),
        content:"",
        threatId: [],
        type,
        name: '',
        libraryId:this.arrOpService.genRandomId(20),
        description: '',
        goalId: [],
        categoryId: '',
        categoryName: '',
      }
    }
  }

  // Calculate the largest row number from goals observable
  public getLargestRowNumber(type) {
    const goals: CybersecurityGoal[] = this.goals.value ? this.goals.value : [];
    let filteredGoals = goals.filter(goals=>goals.type == type)
    const largestValue: number = filteredGoals.length > 0 ? Math.max.apply(Math, filteredGoals.map((_: CybersecurityGoal) => _.rowNumber)) : 0;
    return largestValue;
  }



  updateControlGoalIds(item: any) {
    this.updateGoalId.next(item);
  }
}
