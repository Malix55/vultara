import { Wp29ThreatService } from './../services/wp29-threat.service';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'threatRowNumbers'
})

export class ThreatRowNumbersPipe implements PipeTransform {
    constructor(private wp29ThreatService: Wp29ThreatService) { }

    transform(result: any, ...args: any[]): any {
        const initialIndex: number = 0;
        const rowNumbers: number[] = this.wp29ThreatService.getThreatIndex(result, args[0], initialIndex, []);
        return rowNumbers.join(", ");
    }
}