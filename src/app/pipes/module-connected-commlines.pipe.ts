import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Pipe({
  name: 'moduleConnectedCommlines'
})
export class ModuleConnectedCommlinesPipe implements PipeTransform {

  transform(newDesign: any, ...args: any[]) {
    const moduleId: string = args[0];
    const module: any = [...newDesign.micro, ...newDesign.controlUnit].find((_: any) => _.id === moduleId);
    const modulesId: string[] = module ? module.lineId : [];
    return newDesign ? newDesign.commLine.filter((_: any) => modulesId.includes(_.id)) : [];
  }

  // transform(threats: ThreatItem[], ...args: any[]) {
  //   const moduleId: string = args[0];
  //   const newDesign: any = args[1];

  //   if (moduleId && newDesign) {
  //     const module: any = this.getModule(moduleId, newDesign);
  //     if (module) {
  //       const lineId: string[] = module.lineId;
  //       if (lineId && lineId.length > 0) {
  //         return newDesign.commLine && newDesign.commLine.length > 0 ? newDesign.commLine.filter((__: any) => lineId.includes(__.id)) : [];
  //       }
  //     }
  //   }

  //   return [];
  // }

  // // Get module object from newDesign via moduleId
  // private getModule(moduleId: any, newDesign: any) {
  //   const module: any = newDesign.micro.find((_: any) => _.id === moduleId);
  //   if (module) {
  //     return module;
  //   } else {
  //     const module: any = newDesign.controlUnit.find((_: any) => _.id === moduleId);
  //     if (module) {
  //       return module;
  //     }
  //   }

  //   return null;
  // }

}
