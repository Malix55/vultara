import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityIcon',
    pure: false
})

export class FeasibilityIconPipe implements PipeTransform {
    transform(row: any, ...args: any[]): any {
        if (row.treatment === "no treatment") {
            const isFilled: boolean = (row.attackFeasibilityElapsedRationale && row.attackFeasibilityElapsedRationale !== "")
                && (row.attackFeasibilityExpertiseRationale && row.attackFeasibilityExpertiseRationale !== "")
                && (row.attackFeasibilityKnowledgeRationale && row.attackFeasibilityKnowledgeRationale !== "")
                && (row.attackFeasibilityWindowRationale && row.attackFeasibilityWindowRationale !== "")
                && (row.attackFeasibilityEquipmentRationale && row.attackFeasibilityEquipmentRationale !== "");
            if (isFilled) {
                return "check_circle_outline";
            } else {
                return "help_outline";
            }
        } else {
            const isAfterFilled: boolean = (row.attackFeasibilityElapsedAfterRationale && row.attackFeasibilityElapsedAfterRationale !== "")
                && (row.attackFeasibilityExpertiseAfterRationale && row.attackFeasibilityExpertiseAfterRationale !== "")
                && (row.attackFeasibilityKnowledgeAfterRationale && row.attackFeasibilityKnowledgeAfterRationale !== "")
                && (row.attackFeasibilityWindowAfterRationale && row.attackFeasibilityWindowAfterRationale !== "")
                && (row.attackFeasibilityEquipmentAfterRationale && row.attackFeasibilityEquipmentAfterRationale !== "");
            if (isAfterFilled) {
                return "check_circle_outline";
            } else {
                return "help_outline";
            }
        }
    }
}