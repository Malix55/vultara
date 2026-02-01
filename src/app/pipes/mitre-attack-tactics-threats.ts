import { Pipe, PipeTransform } from '@angular/core';
import { MitreAttackService } from '../services/mitre-attack.service';

@Pipe({
    name: 'tacticThreats',
    pure: false
})

export class TacticsThreatsPipe implements PipeTransform {
    constructor(
        private mitreAttackService: MitreAttackService
    ) { }

    transform(method: any, ...args: any[]): any {
        const tacticVId: number = args[0];
        switch (method) {
            case "ATM":
                return this.mitreAttackService.getTacticThreats(tacticVId);

            default:
                return this.mitreAttackService.getTacticThreats(tacticVId);
        }
    }
}