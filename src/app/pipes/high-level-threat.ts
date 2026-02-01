import { Wp29ThreatService } from './../services/wp29-threat.service';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highLevelThreat'
})

export class HighLevelThreatPipe implements PipeTransform {
    constructor(private wp29ThreatService: Wp29ThreatService) { }

    transform(threats: any[], ...args: any[]): any {
        const dataArray = this.wp29ThreatService.calculateWP29ThreatRows(threats);
        return dataArray;
    }
}