import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mediaPipe',
  pure:false
})
export class MediaPipePipe implements PipeTransform {

    transform(items: any[], input:any): any {
     let value = items && items.filter(element => element.includes(input));
      return value;
    }

}