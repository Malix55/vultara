import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'assetPropertyAction',
  pure: false
})
export class AssetPropertyActionPipe implements PipeTransform {

  transform(editable: boolean, ...args: any[]): unknown {
    if (editable) {
      return args[0] ? false : true;
    }

    return false;
  }

}
