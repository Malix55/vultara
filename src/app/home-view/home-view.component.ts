import { Router } from '@angular/router';
import { UserProfile, AuthenticationService } from './../services/authentication.service';
import { Component, OnInit, NgModule } from '@angular/core';
import { ResultSharingService } from './../services/result-sharing.service';
import { ComponentList, ThreatItem } from './../../threatmodel/ItemDefinition';
import { BrowserModule } from '@angular/platform-browser';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface residualRiskDataType {
  "series": [
    {
      "name": string,
      "value": number,
    },
    {
      "name": string,
      "value": number,
    },
    {
      "name": string,
      "value": number,
    },
    {
      "name": string,
      "value": number,
    },
  ]
} 


@Component({
  selector: 'app-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.css']
})
export class HomeViewComponent implements OnInit {
  resultShared: ThreatItem[] = [];

  constructor(private _resultShared: ResultSharingService, private _authService: AuthenticationService,
    private _router: Router) { }

  readonly relativeUrlLoginView = "/login";
  private unsubscribe: Subject<void> = new Subject();

  ngOnInit(): void {
    this._resultShared.resultSharedObs
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resultData) => this.resultShared = resultData);
    this.resultShared = JSON.parse(localStorage.getItem("result"));
    localStorage.setItem("intendedUrl", this._router.url);
  }

  ngOnDestroy(){ 
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // residual risk
  view1: any[] = [700, 400];
  criticalRiskCount = this.resultShared.map( x => x.riskLevel == "critical").length;
  residualRiskData = [
      {
        "name": "Critical",
        "value": 2,
      },
      {
        "name": "High",
        "value": 5,
      },
      {
        "name": "Medium",
        "value": 3,
      },
      {
        "name": "Low",
        "value": 9,
      },
  ];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  xAxisLabel = 'Residual Risk';
  showYAxisLabel = true;
  yAxisLabel = 'Threat Item Count';

  colorScheme1 = {
    domain: ['#A10A28', '#FF4500', '#C7B42C', '#5AA454']
  };
  onSelect1(event) {
    console.log(event);
  }

  // risk mitigation progress
  view2: any[] = [700, 400];
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel2: boolean = true;
  showXAxisLabel2: boolean = true;
  xAxisLabel2: string = 'Monthly Assessment';
  yAxisLabel2: string = 'Aggregated Risk Score';
  timeline: boolean = true;

  multi = [
    {
      "name": "Aggregated Risk Score",
      "series": [
        {
          "name": "May",
          "value": 87
        },
        {
          "name": "June",
          "value": 66
        },
        {
          "name": "July",
          "value": 23
        }
      ]
    }
  ];
  
  colorScheme2 = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#aae3f5']
  };
  onSelect2(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate2(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate2(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }

  // risk treatment completion 
  single: any[];
  view3: any[] = [400, 400];
  colorScheme3 = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  value: number = 41;
  previousValue: number = 30;
  units: string = '%';

  onSelect3(event) {
    console.log(event);
  }

}
