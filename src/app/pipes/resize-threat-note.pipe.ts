import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'resizeThreatNote'
})
export class ResizeThreatNotePipe implements PipeTransform {

  transform(treatment: string, ...args: any[]): unknown {
    switch (args[0]) {
      case 'min':
        return treatment === 'retain' || treatment === 'share' || treatment === 'reduce' ? '25' : '50';
      case 'max':
        return treatment === 'retain' || treatment === 'share' || treatment === 'reduce' ? '30' : '60';

      default:
        break;
    }
    return null;
  }

}
