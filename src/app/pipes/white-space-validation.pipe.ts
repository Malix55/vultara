import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'whiteSpaceValidation'
})
export class WhiteSpaceValidationPipe implements PipeTransform {

  transform(value: string): boolean {
    if(value.trim() == ""){
      return true
    }else{
      return false
    }
  }
}