import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'loadMilestoneCheck'
})
export class LoadMilestoneCheckPipe implements PipeTransform {
//For urls with query parameters the load milestone button was getting disabled this fixes that
  transform(value) {
    let relativeUrlTableVulnerabilityView = "/vulnerabilities";
    let relativeUrlNotificationsAdminView = "/notifications";
    if(!value.includes(relativeUrlTableVulnerabilityView)||!value.includes(relativeUrlNotificationsAdminView)){
      return false;
    }else{
      return true;
    }
  }

}
