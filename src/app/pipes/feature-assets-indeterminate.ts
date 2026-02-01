import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'assetsIndeterminate',
    pure: false
})

export class AssetsIndeterminatePipe implements PipeTransform {
    transform(featureAssets: any, ...args: any[]): any {
        const assets = featureAssets.filter(obj => obj.componentId === args[0] && obj.featureId === args[1]);
        if (assets == null) {
            return false;
        }

        if (assets.filter(t => t.checked).length === assets.length) {
            return false;
        }

        return assets.filter(t => t.checked).length > 0;
    }
}