import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textLength'
})
export class TextLengthPipe implements PipeTransform {

  transform(text: string, ...args: any[]): unknown {
    const length: number = args[0];
    return text.length >= length ? text.substr(0, length) + '.' : text;
  }

}
