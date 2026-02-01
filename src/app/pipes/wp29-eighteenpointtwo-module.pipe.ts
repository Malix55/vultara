import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Pipe({
  name: 'wp29EighteenpointtwoModule',
  pure: false
})
export class Wp29EighteenpointtwoModulePipe implements PipeTransform {

  transform(newDesign: any, ...args: any[]): ThreatItem {
    const id: string = args[0] ? args[0] : "";
    const modules: any[] = newDesign ? [...newDesign.micro, ...newDesign.controlUnit] : [];
    return modules.find((_: any) => _.id === id);
  }

}
