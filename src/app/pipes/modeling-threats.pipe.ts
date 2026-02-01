import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Pipe({
  name: 'modelingThreats',
  pure: false
})
export class ModelingThreatsPipe implements PipeTransform {

  transform(threats: ThreatItem[], ...args: any[]): unknown {
    const activeComponentId: string = args[0];
    return threats.filter((_: ThreatItem) => {
      if (_.threatSource === "merged") {
        return _.componentId.split(",").includes(activeComponentId) || _.attackPath.includes(activeComponentId);
      } else {
        return _.componentId === activeComponentId || _.attackPath.includes(activeComponentId);
      }
    });
  }

}
