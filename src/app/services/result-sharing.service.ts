import { ThreatItem } from './../../threatmodel/ItemDefinition';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ArrOpService } from './arr-op.service';



@Injectable({
  providedIn: 'root'
})
export class ResultSharingService {
  private _threatList: ThreatItem[] = [];
  private _resultShared = new BehaviorSubject(this._threatList);
  private _resultSharedBackup = new BehaviorSubject(this._threatList);

  resultUpdated: boolean = false;
  resultSharedObs = this._resultShared.asObservable();
  resultSharedBackupObs = this._resultSharedBackup.asObservable();

  public permanentlyDeletedThreats: ThreatItem[];
  public permanentlyDeletedThreatsLoaded: boolean = false;
  public threatListBackup: ThreatItem[] = [];

  constructor(private _ArrOp: ArrOpService) { }

  loadLocalStorage() { // load result from localStorage
    const storedObj: ThreatItem[] = JSON.parse(localStorage.getItem('result'));
    this._resultSharedBackup.next(storedObj);
    this.updateEntireResult(storedObj);
  };

  // Get all backup threats from observable
  getAllThreatsFromBackup() {
    return this._resultSharedBackup.value;
  }

  // Update both shared and backup threat list observable.
  updateEntireResult(data: ThreatItem[]) {
    this.resultUpdated = true;
    this._resultShared.next(data);
    this.updateBackupThreatList(data);
  };

  updateResult(id: string, data: any, property: string) {
    this.resultUpdated = true;
    let activeThreatIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._resultShared.value);
    this._resultShared.value[activeThreatIndex][property] = data;
  };

  setResultUpdated(updated: boolean) {
    this.resultUpdated = updated;
  }

  emptyResult() {
    this.updateEntireResult([]);
  }

  emptyBackupThreatList(data){
    this._resultSharedBackup.next(data);
  }

  getResult(property: string, data: any): any {
    let returnValue = this._resultShared.value.map((item) => {
      item[property] == data
    });
    return returnValue;
  };

  filterResultByBoundary(newDesign: any, resultData: any): any {
    let filteredResultData = [];
    newDesign.boundary.forEach((boundaryItem) => {
      if (boundaryItem.enable == true) {
        let xRange = [boundaryItem.position[0], boundaryItem.position[0] + boundaryItem.size[0]];
        let yRange = [boundaryItem.position[1], boundaryItem.position[1] + boundaryItem.size[1]];
        newDesign.micro.forEach((microItem) => {
          if (microItem.position[0] > xRange[0] && microItem.position[0] < xRange[1]
            && microItem.position[1] > yRange[0] && microItem.position[1] < yRange[1]) {
            filteredResultData.push.apply(filteredResultData, resultData.filter(threatItem => threatItem.componentId == microItem.id)); // push.apply to merge arrays
          }
        })
        newDesign.controlUnit.forEach((controlUnitItem) => {
          if (controlUnitItem.position[0] > xRange[0] && controlUnitItem.position[0] < xRange[1]
            && controlUnitItem.position[1] > yRange[0] && controlUnitItem.position[1] < yRange[1]) {
            filteredResultData.push.apply(filteredResultData,resultData.filter(threatItem => threatItem.componentId == controlUnitItem.id));
          }
        })
        newDesign.commLine.forEach((commLineItem) => { // this algorithm should work for commLine with multiple terminals
          let terminalXArray = [];
          let terminalYArray = [];
          for (let i = 0; i < commLineItem.position.length; i = i + 2) {
            terminalXArray.push(commLineItem.position[i])
          };
          for (let i = 1; i < commLineItem.position.length; i = i + 2) {
            terminalYArray.push(commLineItem.position[i])
          };
          let xOutlier = terminalXArray.find(x => x < xRange[0] || x > xRange[1]);
          let yOutlier = terminalYArray.find(y => y < yRange[0] || y > yRange[1]);
          if (xOutlier == undefined && yOutlier == undefined) {
            filteredResultData.push.apply(resultData.filter(threatItem => threatItem.componentId == commLineItem.id));
          }
        })
      }
    })
    const ds = filteredResultData.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i).sort((a, b) => a.threatRowNumber-b.threatRowNumber)
    return ds;
    // return filteredResultData
  }

  // function to rate feasibility level if a feasibility metric is changed in the collapsed table row
  public rateFeasibility(threatItem, feasibilityMethod, feasibilityLevelName, feasibilityRating) {
    let score = 0;
    let level = feasibilityLevelName[0]; // High
    switch (feasibilityMethod) {
      case "Attack Potential":
        score = threatItem.attackFeasibilityKnowledge + threatItem.attackFeasibilityExpertise + threatItem.attackFeasibilityEquipment
          + threatItem.attackFeasibilityElapsed + threatItem.attackFeasibilityWindow;
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
        level = threatItem.attackFeasibilityAttackVector;
        break;
      case "CVSS":
        // use environment variable to replace CVSSVector and attackVector from database
        let CVSSVector = 0;
        let trueAV = "";
        trueAV = threatItem.attackFeasibilityAttackVector;
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
        score = 8.22 * CVSSVector * threatItem.attackFeasibilityCVSSPrivilege * threatItem.attackFeasibilityCVSSComplexity
          * threatItem.attackFeasibilityCVSSUser;
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

  // Get updated threats after merging backup and shared threats
  public getUpdatedThreatList(resultShared: ThreatItem[]) {
    resultShared = resultShared ? resultShared : this._resultShared.value;
    const backThreats = this._resultSharedBackup.value ? this._resultSharedBackup.value : [];
    if (resultShared && resultShared.length >= backThreats.length) {
      this._resultSharedBackup.next(resultShared);
      return resultShared;
    }
    return backThreats.map((backupThreat: ThreatItem) => {
      const sharedThreat: ThreatItem = resultShared.find((resultThreat: ThreatItem) => resultThreat.id == backupThreat.id);
      if (sharedThreat) {
        return sharedThreat;
      } else {
        return backupThreat;
      }
    });
  }

  // Update backup threat list observable after merging shared result
  public updateBackupThreatList(sharedThreatList: ThreatItem[]) {
    const threatList: ThreatItem[] = this.getUpdatedThreatList(sharedThreatList);
    this._resultSharedBackup.next(threatList);
  }

  // Reset backup threat list observable
  public resetBackupThreatList(threatList: ThreatItem[]) {
    this._resultSharedBackup.next(threatList);
  }

  // Delete a backup threat by threat id
  public deleteBackupThreatById(threatId: string) {
    let backupThreats: ThreatItem[] = this._resultSharedBackup.value;
    backupThreats = backupThreats.filter((backupThreat: ThreatItem) => backupThreat.id != threatId);
    this._resultSharedBackup.next(backupThreats);
  }

  // Add a backup threat to a specific index.
  public addBackupThreatAtIndex(index: number, threat: ThreatItem) {
    let backupThreats: ThreatItem[] = this._resultSharedBackup.value;
    backupThreats.splice(index, 0, threat);
    this._resultSharedBackup.next(backupThreats);
  }
}
