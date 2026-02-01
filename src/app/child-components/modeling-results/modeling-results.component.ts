import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Component({
  selector: 'app-modeling-results',
  templateUrl: './modeling-results.component.html',
  styleUrls: ['./modeling-results.component.css']
})
export class ModelingResultsComponent implements OnChanges, OnInit {
  @Input() threats: ThreatItem[] = [];
  @Input() activeComponentId: string;
  @Input() systemConfig: any;

  @Output() highlightedThreat: EventEmitter<any> = new EventEmitter<any>();

  displayedColumns: string[] = ['no', 'property', 'risk', 'asset'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'activeComponentId':
            if (this.activeComponentId && !changes[propName].isFirstChange()) {
              this.dataSource.data = this.threats;
              this.paginator.firstPage();
              this.dataSource.paginator = this.paginator;
              this.changeDetector.detectChanges();
            }
            break;
          case 'threats':
            if (this.threats && changes[propName].isFirstChange()) {
              this.dataSource.data = this.threats;
              this.dataSource.paginator = this.paginator;
              this.changeDetector.detectChanges();
            }
            break;
        }
      }
    }
  }

  ngOnInit(): void { }

  // Mouse hover to threat
  public mouseHoverToThreat($event: any, threat: ThreatItem) {
    const obj: any = {
      threat,
      highlight: true
    }
    this.highlightedThreat.emit(obj);
  }

  // Mouse leave from threat
  public mouseLeaveToThreat($event: any, threat: ThreatItem) {
    const obj: any = {
      threat,
      highlight: false
    }
    this.highlightedThreat.emit(obj);
  }
}
