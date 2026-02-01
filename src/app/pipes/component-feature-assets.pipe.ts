import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'componentFeatureAssets'
})
export class ComponentFeatureAssetsPipe implements PipeTransform {

  transform(assetLib: any[] = [], ...args: any[]): unknown {
    const components: any = args[0] ? [...args[0].micro, ...args[0].controlUnit] : [];
    let componentAssetsId: string[] = [];
    components.map((_: any) => _.assetId).forEach((_: any) => {
      componentAssetsId = [...componentAssetsId, ..._];
    });
    componentAssetsId = [...new Set(componentAssetsId)];
    return assetLib.filter((_: any) => componentAssetsId.includes(_._id));
  }

}
