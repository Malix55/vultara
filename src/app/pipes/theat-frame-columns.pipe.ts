import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'threatFrameColumns'
})
export class ThreatFrameColumnsPipe implements PipeTransform {

  transform(treatment: string, ...args: unknown[]): unknown {
    return treatment === 'retain' || treatment === 'share' || treatment === 'reduce' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)';
  }

}
