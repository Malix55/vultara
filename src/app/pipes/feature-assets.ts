import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'featureAssets'
})

export class FeatureAssetsPipe implements PipeTransform {
    transform(assets: any, ...args: any[]): any {
        return assets.filter(asset => asset.componentId === args[0] && asset.featureId === args[1]);
    }
}