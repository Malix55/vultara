import { WP29Model } from './../../../threatmodel/ItemDefinition';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DesignSettingsService } from './../../services/design-settings.service';
import { environment } from './../../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Wp29ThreatService } from './../../services/wp29-threat.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, ViewEncapsulation, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import * as XLSX from 'xlsx';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-wp29-mapping-dialog',
  templateUrl: './wp29-mapping.component.html',
  styleUrls: ['./wp29-mapping.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Wp29MappingDialogComponent implements OnInit, OnDestroy {
  // public threatGroup: any[] = [];
  private fileName: string = 'WP29Report.xlsx';
  readonly projectRootUrl = environment.backendApiUrl + "projects";
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<Wp29MappingDialogComponent>,
    public wp29ThreatService: Wp29ThreatService,
    private _http: HttpClient,
    private _snackBar: MatSnackBar,
    private _editDesignShared: DesignSettingsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.wp29ThreatService.threatGroup = [];
    this.wp29ThreatService.filterWP29Threats(this.data.threats);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public exportToExcel() {
    const data: any[] = this.wp29ThreatService.calculateWP29Threats(this.wp29ThreatService.threatGroup, this.data.result);
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ThreatMapping');
    XLSX.writeFile(wb, this.fileName);
  }

  // Apply database changes (newDesign.project.wp29) and update mappingStatus value 
  public changeMappingStatus($event: any, index: number, wp29ThreatIndex: string) {
    this.wp29ThreatService.mappingStatus[index] = $event;

    const wp29: WP29Model = {
      wp29ThreatIndex,
      mappingStatus: this.wp29ThreatService.getMappingStatusFromColor($event)
    }
    const project={
      id:this.data.project.id
    }
    this._http
      .post(this.projectRootUrl + "/wp29ThreatIndexes", { project , wp29 })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (res) {
          const newDesign = JSON.parse(localStorage.getItem('newDesign'));
          newDesign.project.wp29 = res;
          this.data.project.wp29 = res;
          localStorage.setItem('newDesign', JSON.stringify(newDesign));

          this._editDesignShared.updateProjectProperty(res, "wp29");
          this._editDesignShared.updateNewDesignComponents(newDesign);
          this._snackBar.open("WP29 threat index value is successfully updated.", "", {
            duration: 3000,
          });
        }
      });
  }
}
