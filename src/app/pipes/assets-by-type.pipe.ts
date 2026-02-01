import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Pipe({
  name: 'assetsByType'
})
export class AssetsByTypePipe implements PipeTransform {

  transform(threats: ThreatItem[] = [], ...args: any[]): unknown {
    const types: string[] = args[0] ? args[0] : [];
    return threats.filter((_: ThreatItem, index: number, self: ThreatItem[]) => {
      if (types.includes(_.assetType)) {
        return index === self.findIndex((__: ThreatItem) => (
          __.assetId === _.assetId
        ))
      }

      return false;
    }).map((_: ThreatItem) => {
      return {
        asset: _.asset,
        assetId: _.assetId
      }
    });
  }

}
