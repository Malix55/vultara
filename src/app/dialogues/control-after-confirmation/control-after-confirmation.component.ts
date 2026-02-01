import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { ResultSharingService } from 'src/app/services/result-sharing.service';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Component({
  selector: 'app-control-after-confirmation',
  templateUrl: './control-after-confirmation.component.html',
  styleUrls: ['./control-after-confirmation.component.css']
})
export class ControlAfterConfirmationComponent implements OnInit,OnDestroy {

   // newDesign is the list of all components to document what's on the canvas
   public newDesign ;
   resultShared: ThreatItem[] = [];
   dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
   private unsubscribe: Subject<void> = new Subject();
 
 
 
 
   constructor(
     public dialogRef: MatDialogRef<ControlAfterConfirmationComponent>,
     @Inject(MAT_DIALOG_DATA) public data: any,
     private _resultShared: ResultSharingService,
     private _editDesignShared: DesignSettingsService, 
     private _cdRef: ChangeDetectorRef
   ) { }
 
   ngOnInit(): void {
     this._editDesignShared.addToDesign
     .pipe(takeUntil(this.unsubscribe))
     .subscribe((designData) => this.newDesign = designData)
 
     this._resultShared.resultSharedObs
       .pipe(takeUntil(this.unsubscribe))
       .subscribe((resultData: any) => {
        
           this.resultShared = resultData;
           if (this.dataSource) {
             this.dataSource.data = resultData;
           }
           this._cdRef.detectChanges();
       
       });
   }
 
 
   ngOnDestroy(){
     this.unsubscribe.next();
     this.unsubscribe.complete();
   }
 
 
   // Delete threat permanently
   public deletePermanently() {
     this.dialogRef.close("permanentDelete");
     this.deleteThreatPermanently(this.data.threat)
   }
 
   // Delete threat temporarily
   public deleteTemporarily() {
     this.dialogRef.close("temporaryDelete");
     this.deleteThreatTemporarily(this.data.threat)
 
   }
 
 
 
 
 
 
 // Delete a threat permanently from threat list. Save the threat threatRuleEngineId to deletedThreatId array 
  deleteThreatPermanently(row: any) {
   
   const threatRuleEngineId = row.threatRuleEngineId;
 
   this.deleteThreatTemporarily(row);
 
   const deletedThreatId = this.newDesign.project.deletedThreatId ? this.newDesign.project.deletedThreatId : [];
   if (!deletedThreatId.includes(threatRuleEngineId)) {
     deletedThreatId.push(threatRuleEngineId);
     this.newDesign.project.deletedThreatId = deletedThreatId;
     this._resultShared.permanentlyDeletedThreats = this._resultShared.permanentlyDeletedThreats ?
       [...this._resultShared.permanentlyDeletedThreats, row].filter((value: ThreatItem, index: number, self: ThreatItem[]) => self.findIndex((_: ThreatItem) => _.threatRuleEngineId === value.threatRuleEngineId) === index) :
       [row];
   }
   this._editDesignShared.updateEntireNewDesign(this.newDesign);
 }
 
 
 
 
 
 
 
 
 
 
 // Delete a threat temporarily from threat list.
 private deleteThreatTemporarily(row: any) {
   let index = this.dataSource.data.indexOf(row);
   this.resultShared.splice(index, 1);
   this.dataSource.data = this.resultShared;
   this._resultShared.resultUpdated = true;
   this._resultShared.updateEntireResult(this.resultShared);
 
   this._cdRef.detectChanges();
 }
 
 

}
