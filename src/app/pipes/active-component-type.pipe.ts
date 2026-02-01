import { Pipe, PipeTransform } from '@angular/core';
import { DesignSettingsService } from '../services/design-settings.service';

@Pipe({
  name: 'activeComponentType',
  pure: false
})
export class ActiveComponentTypePipe implements PipeTransform {
  constructor(
    private editDesignShared: DesignSettingsService
  ) { }

  transform(activeComponentType: string, ...args: any[]): any {
    const componentId: string = args[0];
    if (activeComponentType === "commLine" && this.editDesignShared.getCommLineProperty(componentId, "sensorInput")) {
      return "sensorInput";
    }

    return activeComponentType;
  }

}
