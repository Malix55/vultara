import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'riskTitle',
    pure: false
})

export class RiskTitlePipe implements PipeTransform {
    transform(treatment: any, ...args: any[]): any {
        const riskLevelBefore = args[0];
        const riskLevel = args[1];
        switch (treatment) {
            case 'no treatment':
                return `Risk: ${riskLevelBefore ? riskLevelBefore : riskLevel}`;

            default:
                return `Risk(Before Treatment &#8594; After Treatment): ${riskLevelBefore ? riskLevelBefore : riskLevel}
          &#8594; ${riskLevel}`;

        }
    }
}