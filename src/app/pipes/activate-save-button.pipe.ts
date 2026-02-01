import { Pipe, PipeTransform } from '@angular/core';
import { VulnerabilityService } from '../services/vulnerability.service';

@Pipe({
  name: 'activateSaveButton',
  pure: false
})
export class ActivateSaveButtonPipe implements PipeTransform {

  constructor(
    private vulnerabilityService: VulnerabilityService
  ) { }

  transform(currentUrl: string, ...args: any[]): unknown {
    const projectName: string = args[0] ? args[0] : '';
    const projectStatus: any = args[1] ? args[1] : null;
    const relativeUrlSecurityGoalAdminView: string = args[2];
    const relativeUrlModelingView: string = args[3];
    const relativeUrlThreatsView: string = args[4];
    const relativeUrlTableVulnerabilityView: string = args[5];

    if (!projectName || projectStatus?.milestoneView) {
      return true;
    }
    
    if(currentUrl.includes(relativeUrlTableVulnerabilityView)){
      return false;
    }

    switch (currentUrl) {
      case relativeUrlThreatsView:
      case relativeUrlModelingView:
      case relativeUrlSecurityGoalAdminView:
      case relativeUrlTableVulnerabilityView:
        return false;
      // case relativeUrlTableVulnerabilityView:
      //   if(this.vulnerabilityService.deletedVulnerabilities.length > 0 || this.vulnerabilityService.updatedVulnerbilities.length > 0 || this.vulnerabilityService.addedVulnerabilities.length > 0){
      //     return false;
      //   } else {
      //     return true;
      //   }
      // return !this.vulnerabilityService.enableSavingVulnerability;
      default:
        return true;
    }
  }

}
