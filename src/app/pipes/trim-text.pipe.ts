import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimText',
  pure: false
})
export class TrimTextPipe implements PipeTransform {

  transform(text: string, ...args: unknown[]): unknown {
    return text.trim();
  }

}
