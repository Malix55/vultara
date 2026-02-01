import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  public systemData: any;

  constructor() { }

  // Get feasibility rating from system config data
  public getFeasibilityRating() {
    if (this.systemData) {
      switch (this.systemData.feasibilityMethod) {
        case "Attack Potential":
          return this.systemData.feasibilityRatingAP;
        case "CVSS":
          return this.systemData.feasibilityRatingCVSS;
        case "Attack Vector":
          return this.systemData.feasibilityRatingAV[1];
      };
    }

    return [];
  }

  // Get risk matrix from system config data
  public getRiskMatrix() {
    if (this.systemData) {
      const riskMatrixName = this.systemData.riskMethod;
      const riskMatrixNameIndex = this.systemData.riskMethodMapping.indexOf(riskMatrixName);
      return this.systemData.riskMatrix[riskMatrixNameIndex];
    }

    return [];
  }
}
