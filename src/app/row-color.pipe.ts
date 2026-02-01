import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rowColor',
  pure: false
})
export class RowColorPipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): any {
    //If row is both reviewed and highlighted use highlighted Background-color
    if(value.reviewed == true && value.highlighted == true){
      return 'rgba(255, 99, 71,0.2)'
    }

    if(value.reviewed==true){
      return 'rgba(252, 243, 207, 0.2)'
    }else if(value.highlighted==true){
      return 'rgba(255, 99, 71,0.2)'
    }
  }

}
