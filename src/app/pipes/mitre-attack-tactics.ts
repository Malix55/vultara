import { Pipe, PipeTransform } from '@angular/core';
import { MitreAttackService } from '../services/mitre-attack.service';

@Pipe({
    name: 'mitreAttackTactics',
    pure: false
})

export class MitreAttackTacticsPipe implements PipeTransform {
    constructor(
        private sharedMitreAttackService: MitreAttackService
    ) { }

    transform(method: any, ...args: any[]): any {
        switch (method) {
            case "ATM":
                return this.sharedMitreAttackService.atmTactics;

            default:
                return this.sharedMitreAttackService.atmTactics;
        }
    }
}