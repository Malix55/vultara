import { Pipe, PipeTransform } from '@angular/core';
import { MitreAttackService } from '../services/mitre-attack.service';

@Pipe({
    name: 'mitreAttackDropZones',
    pure: false
})

export class MitreAttackDropZonesPipe implements PipeTransform {
    constructor(
        private mitreAttackService: MitreAttackService
    ) { }
    transform(method: any, ...args: any[]): any {
        switch (this.mitreAttackService.mitreAttackBottomPanelType) {
            case "Control":
                return ["mitreBeforeControl", "mitreAfterControl"];

            case "ATTACK":
                let count: number = 0;
                const excludeIndex: number = args[0] ? args[0] : undefined;
                const zones: string[] = ["threatListTable"];
                switch (method) {
                    case "ATM":
                        count = this.mitreAttackService.atmTactics.length;
                        break;

                    default:
                        break;
                }

                for (let index = 0; index < count; index++) {
                    if (excludeIndex && index === excludeIndex) continue;
                    zones.push("mitre-attack-component-" + index);
                }

                return zones;
        }
    }
}