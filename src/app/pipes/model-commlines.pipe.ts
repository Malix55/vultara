import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Pipe({
  name: 'modelCommlines'
})
export class ModelCommlinesPipe implements PipeTransform {

  transform(threats: ThreatItem[], ...args: unknown[]): unknown {
    const selectedCommLinesThreats = threats.filter((_: ThreatItem, index: number, self: ThreatItem[]) => {
      if (_.type === "commLine") {
        return index === self.findIndex((__: ThreatItem) => (
          __.componentId === _.componentId
        ));
      }
      return false;
    });
    return selectedCommLinesThreats;
  }

}
