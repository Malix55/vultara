import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-threat-history',
  templateUrl: './threat-history.component.html',
  styleUrls: ['./threat-history.component.css']
})
export class ThreatHistoryComponent implements OnInit, OnDestroy {
  readonly milestonesUrl = environment.backendApiUrl + "milestones";

  public loadMilestones: boolean = true;
  public loadingDone: boolean = false;
  public milestoneThreats: any[] = [];
  public displayedColumns: string[] = ['asset', 'securityPropertyCia', 'threatScenario', 'attackPath', 'damageScenario', 'impact',
    'attackFeasibility', 'riskLevel'];
  public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  private unsubscribe: Subject<void> = new Subject();
  private limit: number = 20;
  private skip: number = 0;

  constructor(
    public dialogRef: MatDialogRef<ThreatHistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.loadMilestonesByDate();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Load milestones by chronological order and apply pagination.
  private loadMilestonesByDate() {
    this.http
      .get(`${this.milestonesUrl}?projectId=${this.data.projectId}&skip=${this.skip}&limit=${this.limit}&threatRuleEngineId=${this.data.threatRuleEngineId}`)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.loadMilestones = false;
        if (res && res.success) {
          if (res.data.length === 0 || res.data.length < this.limit) {
            this.loadingDone = true;
          }
          res.data.forEach((milestone: any) => {
            const datePipe = new DatePipe('en-US');
            const milestoneInfo: string = milestone.project.milestoneName + ", milestone created at " + datePipe.transform(milestone.createdAt, 'M/d/y, h:mm a');
            this.milestoneThreats.push({ attackPathName: milestoneInfo, milestoneHeading: true });
            this.milestoneThreats.push(milestone.threat);
          });
          this.dataSource.data = this.milestoneThreats;
          this.skip = this.skip + this.limit;
        }
      }, (error: any) => this.loadMilestones = false);
  }

  // Load more milestones upon clicking on "Load More" button
  public loadMore() {
    this.loadMilestones = true;
    this.loadMilestonesByDate();
  }
}
