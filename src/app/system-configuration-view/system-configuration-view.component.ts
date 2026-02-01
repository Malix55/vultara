import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { takeUntil, take } from 'rxjs/operators';
import { RiskMatrixColor } from '../services/enum.model';


@Component({
  selector: 'app-system-configuration-view',
  templateUrl: './system-configuration-view.component.html',
  styleUrls: ['./system-configuration-view.component.css']
})
export class SystemConfigurationViewComponent implements OnInit {

  constructor(private _http: HttpClient, private _router: Router, private _snackBar: MatSnackBar,) { }
  selectedFeasibilityMethod: string;
  selectedMitreAttackMethod: string;
  selectedTabIndex: number = 0;
  feasibilityMethods: string[] = ['Attack Potential', 'CVSS', 'Attack Vector'];
  mitreAttackMethods: string[] = ['ATM', 'Enterprise', 'Mobile', 'ICS'];
  readonly systemConfigRootUrl = environment.backendApiUrl + "config";

  impactLevelColumn: string[];
  feasibilityLevelNameColumn: string[];

  riskMatrixTable: Array<any>;

  riskMethodMappings: string[];
  selectedRiskMethodMapping: string;

  customRiskMatrixData: Array<any>;

  count = 0;
  feasibilityValueType: string;

  ngOnInit(): void {
    localStorage.setItem("intendedUrl", this._router.url);
    this._http
      .get(this.systemConfigRootUrl + "/systemconfig")
      .pipe(take(1))
      .subscribe((res: any) => {
        // console.log({res});
        this.feasibilityValueType = res.feasibilityValue;
        this.riskMatrixTable = new Array<any>();

        this.feasibilityLevelNameColumn = ['', ...res.feasibilityLevelName];
        this.impactLevelColumn = res.impactLevelName.reverse();
        this.selectedRiskMethodMapping = res.riskMethod;
        this.selectedMitreAttackMethod = res.mitreAttackMethod;

        if (res.riskMethodMapping && res.riskMethodMapping.length > 0) {
          this.riskMethodMappings = res.riskMethodMapping;
        }

        if (res.riskMatrix && res.riskMatrix.length > 0) {
          for (const item of res.riskMatrix) {
            const a = [];

            item.forEach(element => {
              a.push([...element.reverse()]);
            });

            const matrix = [[0, 0, 0, 0], ...a];
            this.riskMatrixTable.push(matrix);
          }
        }

        if (this.feasibilityMethods.includes(res.feasibilityMethod)) {
          this.selectedFeasibilityMethod = res.feasibilityMethod;
        } else {
          this._snackBar.open("Network busy or system configuration library not available.", "Error!", {
            duration: 3000,
          })
        }
      });
  }

  confirmFeasibilityMethod() {
    const riskMatrix = [];

    for (let index = 0; index < this.riskMatrixTable.length; index++) {
      let arr = [];

      this.riskMatrixTable[index].forEach(element => {
        const a = [];
        Object.assign(a, element);
        arr.push([...a.reverse()]);
      });

      arr.shift();
      riskMatrix.push(arr)
    }

    this._http
      .post(this.systemConfigRootUrl + "/systemconfig",
        {
          "mitreAttackMethod": this.selectedMitreAttackMethod,
          "feasibilityMethod": this.selectedFeasibilityMethod,
          "riskMatrix": riskMatrix,
          "riskMethod": this.selectedRiskMethodMapping,
          "feasibilityValue": this.feasibilityValueType
        })
      .pipe(take(1))
      .subscribe((res: any) => {
        // console.log(res);
        if (res.feasibilityMethod == this.selectedFeasibilityMethod) {
          this._snackBar.open("Configuration updated!", "Successful!", {
            duration: 3000,
          })
        } else {
          this._snackBar.open("Configuration not updated!", "Failed!", {
            duration: 3000,
          });
          this.selectedFeasibilityMethod = res.feasibilityMethod;
        }
      })
  }

  // function triggers when a tab is clicked
  settingsTabClick(event) {
    if (event.index == 0) { // Feature Library tab is clicked. no action

    }
  }

  getTableValue(x: number, y: number, index: number): any {
    try {
      this.count = y == this.impactLevelColumn.length - 1 ? 0 : this.count + 1;
      return this.riskMatrixTable[index][x][y] == 0 ? this.impactLevelColumn[y] : this.riskMatrixTable[index][x][y];
    } catch (error) {
      return 0;
    }
  }

  isNumber(value: any): boolean {
    return typeof value === 'number' && isFinite(value);
  }

  getBackgroundColor(value: number) {
    let colorName = '';

    switch (value) {
      case 1:
        colorName = RiskMatrixColor.level1;
        break;
      case 2:
        colorName = RiskMatrixColor.level2;
        break;
      case 3:
        colorName = RiskMatrixColor.level3;
        break;

      case 4:
        colorName = RiskMatrixColor.level4;
        break;
      case 5:
        colorName = RiskMatrixColor.level5;
        break;
    }

    return colorName;
  }

  changeBackgroundColor(self: any, value: string, x: number, y: number, index: number) {
    const colorName = this.getBackgroundColor(parseInt(value));
    var arr = [RiskMatrixColor.level1, RiskMatrixColor.level2, RiskMatrixColor.level3, RiskMatrixColor.level4, RiskMatrixColor.level5];

    document.getElementById(self.target.id).classList.remove(arr.join(','));
    document.getElementById(self.target.id).parentElement.classList.remove(arr.join(','));
    document.getElementById(self.target.id).classList.add(colorName);
    document.getElementById(self.target.id).parentElement.classList.add(colorName);

    this.riskMatrixTable[index][x][y] = parseInt(value);
  }
}
