import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthenticationService, UserProfile } from 'src/app/services/authentication.service';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { MitreAttackService } from 'src/app/services/mitre-attack.service';
import { ResultSharingService } from 'src/app/services/result-sharing.service';
import { environment } from 'src/environments/environment';
import { mitreAttackIndexInterface, ThreatItem, TacticInterface } from 'src/threatmodel/ItemDefinition';
import { DeleteThreatComponent } from '../delete-threat/delete-threat.component';
import { TacticTechniqueComponent } from '../tactic-technique/tactic-technique.component';

export enum BOTTOMPANEL {
  Attack = 'ATTACK',
  Control = 'Control'
}

@Component({
  selector: 'app-mitre-attack',
  templateUrl: './mitre-attack.component.html',
  styleUrls: ['./mitre-attack.component.css'],
  host: { '[id]': 'id' }
})
export class MitreAttackComponent implements OnInit, OnChanges, OnDestroy {
  @Output() action = new EventEmitter<boolean>();

  @Input() mitreAttackMethod: string;
  @Input() threats: ThreatItem[] = [];
  @Input() impactAggMethod: any;
  @Input() impactLevelName: any;
  @Input() feasibilityLevelName: any;
  @Input() riskMatrix: any;
  @Input() mergedThreat: ThreatItem;
  @Input() toggleMergedThreatChanges: boolean;

  public tactics: TacticInterface[] = [];
  public editTacticThreat: any = {};
  public BOTTOMPANEL: any = BOTTOMPANEL;

  private currentUserProfile: UserProfile;
  private unsubscribe: Subject<void> = new Subject<void>();
  readonly projectRootUrl = environment.backendApiUrl + "projects";
 
  attackDroppedArray=[]
  newDesign: any;
  resultShared: ThreatItem[] = [];

  constructor(
    public mitreAttackService: MitreAttackService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private _http: HttpClient,
    private changeDetector: ChangeDetectorRef,
    private authService: AuthenticationService,
    private _resultShared: ResultSharingService,
    private _editDesignShared: DesignSettingsService,
    private _cdRef: ChangeDetectorRef,
    
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'toggleMergedThreatChanges': {
            if (this.mergedThreat?.mitreAttackIndex) {
                this.clearTacticsThreats();
                this.setAtomicThreatsFromMergedThreat(this.mergedThreat,this.mergedThreat.threatStore);
            }
          }
        }
      }
    }
  }

  ngOnInit(): void {
    this.authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => this.currentUserProfile = currentUser);

      this._editDesignShared.addToDesign
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((designData) => this.newDesign = designData);
        
      this._resultShared.resultSharedObs
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resultData: any) => {
        if (resultData && resultData.length > 0) {
          resultData = resultData.map(obj => {
            if (obj.highlight === '_riskUpdate') {
              delete obj.highlight;
            }
            return obj;
          });
          this.resultShared = resultData;
       
          this._cdRef.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Select bottom panel type
  bottomPanelSelectionChanged($event: any) {
    this.mitreAttackService.mitreAttackBottomPanelType = $event.checked ? "Control" : "ATTACK";
  }

  // Set atomic threats information upon selecting merged threat
  private setAtomicThreatsFromMergedThreat(mergedThreat: ThreatItem, threats: ThreatItem[]) {
    const mitreAttackIndex: mitreAttackIndexInterface = mergedThreat.mitreAttackIndex;
    const atomicThreatId: string[] = mitreAttackIndex.atomicThreatId ? mitreAttackIndex.atomicThreatId : [];
    const tacticVId: number[] = mitreAttackIndex.tacticVId ? mitreAttackIndex.tacticVId : [];
    const techniqueVId: number[] = mitreAttackIndex.techniqueVId ? mitreAttackIndex.techniqueVId : [];
    const subTechniqueVId: number[] = mitreAttackIndex.subTechniqueVId ? mitreAttackIndex.subTechniqueVId : [];

    atomicThreatId.forEach((_: string, index: number) => {
      const tacticIndex: number = this.mitreAttackService.atmTactics.findIndex((__: TacticInterface) => __.vId === tacticVId[index]);
      if (tacticIndex > -1) {
        let threat: ThreatItem = threats.find((__: ThreatItem) => __.id === _);
        if (threat) {
          threat = {
            ...threat,
            mitreAttackIndex: {
              ...threat.mitreAttackIndex,
              tacticVId: [tacticVId[index] ? tacticVId[index] : -1],
              techniqueVId: [techniqueVId[index] ? techniqueVId[index] : -1],
              removedAfterMerge: [false],
              subTechniqueVId: [subTechniqueVId[index] ? subTechniqueVId[index] : -1],
              mergedThreatId: []
            }
          }
          this.mitreAttackService.addTacticThreat(tacticVId[index], threat);
        }
      }
    });
  }

  // Drop threats between threat list and tactics columns
  drop(event: CdkDragDrop<any>, index: number, mitreAttackTactic: TacticInterface) {
    this.attackDroppedArray.push(event.item.data)
    // this if is triggered if the user tries to change the threat's vertical position in the same column(tactic)
    if (event.previousContainer.id === event.container.id) {
      moveItemInArray(this.mitreAttackService.getTacticThreats(mitreAttackTactic.vId), event.previousIndex, event.currentIndex)
    } else {
      // if it's switching between columns
      if (event.previousContainer.id.startsWith("mitre-attack-component-") && event.container.id.startsWith("mitre-attack-component-")) {
        switch (event.item.data.mitreAttackMethod) {
          case "ATM":
            this.mitreAttackService.addTacticThreatToIndex(mitreAttackTactic.vId, event.item.data.threat, event.currentIndex);
            this.mitreAttackService.deleteTacticThreat(event.item.data.tactic.vId, event.previousIndex);
            const defaultMitreAttackIndex = this.mitreAttackService.getDefaultMitreAttackIndex(this.mitreAttackMethod);
            defaultMitreAttackIndex.tacticVId = [mitreAttackTactic.vId];
            this.mitreAttackService.updateTacticThreatProperty(mitreAttackTactic.vId, event.currentIndex, "mitreAttackIndex", defaultMitreAttackIndex);
            break;
          default:
            break;
        }
      } else { // if it's added to the bottom panel for the first time
        const threat: any = event.item.data;
        switch (this.mitreAttackMethod) {
          case "ATM":
            this.mitreAttackService.addTacticThreatToIndex(mitreAttackTactic.vId, threat, event.currentIndex);
            const defaultMitreAttackIndex = this.mitreAttackService.getDefaultMitreAttackIndex(this.mitreAttackMethod);
            defaultMitreAttackIndex.tacticVId = [mitreAttackTactic.vId];
            defaultMitreAttackIndex.removedAfterMerge = [false];
            this.mitreAttackService.updateTacticThreatProperty(mitreAttackTactic.vId, event.currentIndex, "mitreAttackIndex", defaultMitreAttackIndex);
            break;
          default:
            break;
        }
      }
    }
  }

  // Collapse tactics panel when click on double bar
  public closeMitreAttack() {
    this.action.emit(false);
  }

  // Clear tactics panel when user clicks on Clear button
  clearTacticsThreats() {
    this.mitreAttackService.emptyControlThreats();
    this.attackDroppedArray=[]

    switch (this.mitreAttackMethod) {
      case "ATM":
        this.mitreAttackService.emptyTacticsThreats();
        break;

      default:
        break;
    }
  }

  // Perform mitre Attack/Control merge operation
  public mergeAttackControlConfirmation() {
    switch (this.mitreAttackService.mitreAttackBottomPanelType) {
      case "Control":
        this.mergeControlConfirmation();
        break;
      case "ATTACK":
        this.mergeAttackConfirmation();
        break;

      default:
        break;
    }
  }

  // Merge to new threat via using After/Before Control threats
  private mergeControlConfirmation() {
    let threats=[this.mitreAttackService.mitreControlBeforeThreat,this.mitreAttackService.mitreControlAfterThreat]
    const dialogRef = this.dialog.open(DeleteThreatComponent, {
      width: "500px",
      data:{
        mode:"Control",
        threats
    }
    });


    dialogRef.afterClosed().subscribe((afterClosedRes: any) => {
    if(afterClosedRes){
      if(afterClosedRes.type=="permanent"){
        this.deleteThreatPermanently([threats[0]],"CONTROL",threats)
      }else if(afterClosedRes.type=="temporary"){
        this.deleteThreatTemporarily(threats)
        }



      const threat: ThreatItem = this.mitreAttackService.mergeThreatFromMitreControl(this.mitreAttackService.mitreControlBeforeThreat, this.mitreAttackService.mitreControlAfterThreat, this.currentUserProfile._id);
      const value: any = {
      mergedThreat: threat,
      beforeThreatStatus: afterClosedRes,
      afterThreatStatus: afterClosedRes
      }
      this.mitreAttackService.mergeControlThreatStream.next(value);
    }
    });
  }

  // Merge to new threat via using tactic column threats
  private mergeAttackConfirmation(): void {
    const dialogRef = this.dialog.open(DeleteThreatComponent, {
      width: "500px",
      data:{
        mode:"ATTACK",
        title:"How would you like to treat these threats after merge?",
        body:"These threats will not show up again in future runs if they are permanently deleted, but will show up again in the next run if deleted temporarily."
    }
    });
   
    dialogRef.afterClosed().subscribe(result => {
      if(result){
      let hideUsedThreats: boolean = true;
      let tacticsThreats: any[] = [];
      const tactics: TacticInterface[] = this.mitreAttackService.atmTactics;
      tactics.forEach((_: TacticInterface) => {
        const tacticThreats: any[] = this.mitreAttackService.getTacticThreats(_.vId);
        tacticsThreats = [...tacticsThreats, ...tacticThreats];
      });
      let mergedThreat: ThreatItem = this.mitreAttackService.mergeThreatsWithMitreAttackMethod(
        tacticsThreats, this.mitreAttackMethod, this.threats[this.threats.length - 1].threatRowNumber,
        this.impactAggMethod, this.impactLevelName, this.feasibilityLevelName, this.riskMatrix
      );

      

      hideUsedThreats = !result;
      mergedThreat = this.assignMitreAttckInformationToMergedThreat(mergedThreat, tacticsThreats);
      tacticsThreats = this.assignMitreAttackInformationToChildThreats(mergedThreat, tacticsThreats);
      const threatIds = []
      tacticsThreats.map(item => {
        if (item.threatRuleEngineId) {
          threatIds.push(item.threatRuleEngineId)
        }
      })
      /** Save permanent deleted threats into prject design table  */ //{"project.id":"x7aPUVNx0kQxEBDufNa3"}
      if (result.type === 'permanent') {
        this.deleteThreatPermanently(tacticsThreats)
        this._http.post(this.projectRootUrl + `/projectDb/saveDeletedThreatId`, { projectId: mergedThreat.createdInProject, threatIds }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => res);
      }else if(result.type === 'temporary'){
        this.deleteThreatTemporarily()
      }

      mergedThreat.threatStore=[]
      this.attackDroppedArray.forEach(row=>{
        mergedThreat.threatStore.push(row)
      })
      const value = {
        threat: mergedThreat,
        hideUsedThreats,
        tacticsThreats,
        mergedThreat: this.mergedThreat
      };

      this.mitreAttackService.mergeAttackThreatStream.next(value);

      this.clearTacticsThreats();

      const message: string = this.mergedThreat ? "Existing merged threat is updated!" : "New threat is created!";
      this._snackBar.open(message, "", {
        duration: 3000,
      });
    
      this.attackDroppedArray=[]
    }
  });
  }


  private deleteThreatPermanently(arr: any,mode?,thr?) {

    if(mode=="CONTROL"){
      this.deleteThreatTemporarily(thr);
    }else{
      this.deleteThreatTemporarily();
    }
    arr.forEach(row=>{
    const threatRuleEngineId = row.threatRuleEngineId;
    const deletedThreatId = this.newDesign.project.deletedThreatId ? this.newDesign.project.deletedThreatId : [];
    if (!deletedThreatId.includes(threatRuleEngineId)) {
      deletedThreatId.push(threatRuleEngineId);
      this.newDesign.project.deletedThreatId = deletedThreatId;
      this._resultShared.permanentlyDeletedThreats = this._resultShared.permanentlyDeletedThreats ?
        [...this._resultShared.permanentlyDeletedThreats, row].filter((value: ThreatItem, index: number, self: ThreatItem[]) => self.findIndex((_: ThreatItem) => _.threatRuleEngineId === value.threatRuleEngineId) === index) :
        [row];
    }
    this._editDesignShared.updateEntireNewDesign(this.newDesign);

  })

  }


  // Delete a threat temporarily from threat list.
  private deleteThreatTemporarily(arr?) {
    if(arr){
      arr.forEach(row=>{
        let index = this.resultShared.indexOf(row);
        this.resultShared.splice(index, 1);
      })
      this._resultShared.resultUpdated = true;
      this._resultShared.updateEntireResult(this.resultShared);
      this._cdRef.detectChanges();
      
    }else{
      this.attackDroppedArray.forEach(row=>{
      let index = this.resultShared.indexOf(row);
      this.resultShared.splice(index, 1);
    })
      this._resultShared.resultUpdated = true;
      this._resultShared.updateEntireResult(this.resultShared);
      this._cdRef.detectChanges();
    }
}


  // Assign mitreAttackIndex information to merged threat
  private assignMitreAttckInformationToMergedThreat(threat: ThreatItem,
    childThreats: ThreatItem[]): ThreatItem {
    threat.mitreAttackIndex = this.mitreAttackService.getDefaultMitreAttackIndex(this.mitreAttackMethod);
    threat.mitreAttackIndex.matrix = this.mitreAttackMethod;
    threat.mitreAttackIndex.atomicThreatId = childThreats.map((_: ThreatItem) => _.id);
    threat.mitreAttackIndex.tacticVId = childThreats.map((_: ThreatItem) => _.mitreAttackIndex.tacticVId[0]);
    threat.mitreAttackIndex.techniqueVId = childThreats.map((_: ThreatItem) => _.mitreAttackIndex.techniqueVId[0]);
    return threat;
  }

  // Assign mitreAttackIndex additional information to atomic threats
  private assignMitreAttackInformationToChildThreats(threat: ThreatItem, childThreats: ThreatItem[]): ThreatItem[] {
    return childThreats.map((_: ThreatItem) => {
      return {
        ..._,
        mitreAttackIndex: {
          ..._.mitreAttackIndex,
          mergedThreatId: [threat.id],
          removedAfterMerge: [false]
        }
      }
    })
  }

  // Assign a technique to an atomic threat
  public tacticTechnique(tacticColumnIndex: number, threatIndex: number,
    mitreAttackMethod: string, threat: ThreatItem, tacticVId: number) {
    this.editTacticThreat = {};
    this.editTacticThreat[tacticColumnIndex] = {};
    this.editTacticThreat[tacticColumnIndex][threatIndex] = true;

    const techniqueVId: number[] = this.mitreAttackService.getTacticThreatMitreAttackIndexProperty(tacticVId, threatIndex, "techniqueVId");
    const dialogRef = this.dialog.open(TacticTechniqueComponent, {
      data: {
        tacticVId,
        tacticColumnIndex,
        threatIndex,
        techniqueVId: techniqueVId ? techniqueVId : []
      }
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((dialogData: any) => {
        this.editTacticThreat = {};
        if (dialogData) {
          let mitreAttackIndex: mitreAttackIndexInterface = this.mitreAttackService.getTacticThreatProperty(dialogData.tacticVId, dialogData.threatIndex, "mitreAttackIndex");
          mitreAttackIndex.techniqueVId = [dialogData.techniqueVId];
          this.mitreAttackService.updateTacticThreatProperty(dialogData.tacticVId, dialogData.threatIndex, "mitreAttackIndex", mitreAttackIndex);
        }
        this.changeDetector.detectChanges();
      });
  }

  // Track tactic
  public trackTacticByIndex(index: number, tactic: any) {
    return tactic.vId;
  }

  // Track tactic threat
  public trackTacticThreatByIndex(tacticIndex: number, index: number, threat: any) {
    return index + "-" + tacticIndex;
  }

  // Drop threat from table to Threat Before Control
  dropBeforeControlThreat(event: CdkDragDrop<any>) {
    if (!this.mitreAttackService.mitreControlBeforeThreat) {
      this.mitreAttackService.mitreControlBeforeThreat = event.item.data;
    }
  }

  // Drop threat from table to Threat After Control
  dropAfterControlThreat(event: CdkDragDrop<any>) {
    if (!this.mitreAttackService.mitreControlAfterThreat) {
      this.mitreAttackService.mitreControlAfterThreat = event.item.data;
    }
  }

}
