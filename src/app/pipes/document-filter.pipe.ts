import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'documentFilter',
  pure: false
})
export class DocumentFilterPipe implements PipeTransform {

  transform(items: any[], input:any): any {
    let value = items && items.filter(element => element.helpDocumentId==input);
     return value;
   }
}