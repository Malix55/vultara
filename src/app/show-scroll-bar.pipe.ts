import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'showScrollBar',
  pure:false
})

//Apply scroll class if conditions meet
export class ShowScrollBarPipe implements PipeTransform {

  transform(value) {
    const string = value.join(",");
    if(string.length>44 || value.length>=3){
      return true;
    }else{
      return false;
    }
  }

}
