import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highLevelThreatCount'
})

export class HighLevelThreatCountPipe implements PipeTransform {
    transform(threat: any, ...args: any[]): any {
        const subLevelThreat = threat.subLevelThreat;
        let count = subLevelThreat.length;
        subLevelThreat.forEach(subThreat => {
            count = count + subThreat.wp29Attack.length;
        });
        
        return count;
    }
}