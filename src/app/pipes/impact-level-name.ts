import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'impactLevelName',
    pure: false
})

export class ImpactLevelNamePipe implements PipeTransform {
    transform(impactLevelName: any[], ...args: any[]): any {
        const impactAggMethod = args[0];
        const S = args[1];
        const F = args[2];
        const O = args[3];
        const P = args[4];

        if (impactAggMethod == "mostSevere") {
            let aggregatedImpactIndex = Math.min(impactLevelName.indexOf(S), impactLevelName.indexOf(F), impactLevelName.indexOf(O), impactLevelName.indexOf(P));
            let aggregatedImpact = impactLevelName[aggregatedImpactIndex];
            return aggregatedImpact;
        }

        return "";
    }
}