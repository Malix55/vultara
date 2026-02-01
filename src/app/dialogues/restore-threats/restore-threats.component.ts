import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Component({
  selector: 'app-restore-threats',
  templateUrl: './restore-threats.component.html',
  styleUrls: ['./restore-threats.component.css']
})
export class RestoreThreatsComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject<void>();
  public selectedRestoredThreats: string[] = [];

  readonly rootUrl = environment.backendApiUrl + "projects";

  // public loadingDeletedThreats: boolean = false;
  public displayedColumns: string[] = ['selection', 'rowNumber', 'asset', 'attackPath'];
  public dataSource: MatTableDataSource<ThreatItem> = new MatTableDataSource<ThreatItem>([]);

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<RestoreThreatsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.dataSource.data = this.data.deletedThreat;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Confirm restoring permanently deleted threats
  public confirm() {
    const threatsToRestore: ThreatItem[] = this.dataSource ? this.dataSource.data : [];
    const permanentlyDeletedThreats: ThreatItem[] = threatsToRestore.filter((_: ThreatItem) => this.selectedRestoredThreats.includes(_.threatRuleEngineId));
    const deletedThreatId: string[] = threatsToRestore.filter((_: ThreatItem) => !this.selectedRestoredThreats.includes(_.threatRuleEngineId)).map((_: ThreatItem) => _.threatRuleEngineId);
    if (permanentlyDeletedThreats) {
      const data = {
        threatRuleEngineId: this.selectedRestoredThreats,
        threat: permanentlyDeletedThreats,
        deletedThreatId
      }
      this.dialogRef.close(data);
    } else {
      this.dialogRef.close();
    }
  }

  // Select/deselect a threat from list
  public threatRowSelectionChanged($event: any, threatRuleEngineId: string) {
    if ($event.checked) {
      this.selectedRestoredThreats.push(threatRuleEngineId);
    } else {
      const index = this.selectedRestoredThreats.indexOf(threatRuleEngineId);
      if (index !== -1) {
        this.selectedRestoredThreats.splice(index, 1);
      }
    }
  }

}
