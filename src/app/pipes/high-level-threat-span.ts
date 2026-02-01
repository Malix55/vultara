import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highLevelThreatRowSpan'
})

export class HighLevelThreatRowSpanPipe implements PipeTransform {
    transform(threats: any, ...args: any[]): any {
        let count = 0;
        const threat = threats.find(obj => obj.highLevelThreatId === args[0]);
        const subLevelThreats = threat.subLevelThreats;
        subLevelThreats.forEach((subThreat: any) => {
            count = count + subThreat.wp29Attacks.length;
        });
        return count;
    }
}