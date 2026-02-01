import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Pipe({
  name: 'modelModules'
})
export class ModelModulesPipe implements PipeTransform {

  transform(newDesign: any, ...args: any[]): unknown {
    // const modules: string[] = args[0] ? args[0] : [];
    // const selectedModulesThreats = threats.filter((_: ThreatItem, index: number, self: ThreatItem[]) => {
    //   if (modules.includes(_.type)) {
    //     return index === self.findIndex((__: ThreatItem) => (
    //       __.componentId === _.componentId
    //     ));
    //   }
    //   return false;
    // });
    // return selectedModulesThreats;
    return [...newDesign.micro, ...newDesign.controlUnit];
  }
}
