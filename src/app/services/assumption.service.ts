import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Assumption } from 'src/threatmodel/ItemDefinition';

@Injectable({
  providedIn: 'root'
})
export class AssumptionService {
  private assumptions: BehaviorSubject<Assumption[]> = new BehaviorSubject([]);
  public projectAssumption$ = this.assumptions.asObservable();

  // Update Assumption observable
  public updateProjectAssumption(list: Assumption[] = []) {
    this.assumptions.next(list);
  }
  updatedAssumptions: any[] = []
  addedAssumptions: any[] = []
  deletedAssumptions: any[] = []
  private addedIds = new BehaviorSubject(null);
  currentaddedIds = this.addedIds.asObservable()

  updateAddedIds(item: any) {
    this.addedIds.next(item);
  }
}
