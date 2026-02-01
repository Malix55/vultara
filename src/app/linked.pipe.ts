import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'linked'
})
//checks whether the vulnerability or weakness is linked or not
export class LinkedPipe implements PipeTransform {
  transform(value, ...args) {
    if(value.includes(args[0])) {
      return true;
    } else {
      return false;
    }
  }
}
