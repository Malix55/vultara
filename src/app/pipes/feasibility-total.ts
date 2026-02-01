import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityTotal',
    pure: false
})

export class FeasibilityTotalPipe implements PipeTransform {
    transform(row: any, ...args: any[]): any {
        if (row.treatment === "no treatment") {
            const attackFeasibilityElapsed: number = row.attackFeasibilityElapsed ? Number(row.attackFeasibilityElapsed) : 0;
            const attackFeasibilityExpertise: number = row.attackFeasibilityExpertise ? Number(row.attackFeasibilityExpertise) : 0;
            const attackFeasibilityKnowledge: number = row.attackFeasibilityKnowledge ? Number(row.attackFeasibilityKnowledge) : 0;
            const attackFeasibilityWindow: number = row.attackFeasibilityWindow ? Number(row.attackFeasibilityWindow) : 0;
            const attackFeasibilityEquipment: number = row.attackFeasibilityEquipment ? Number(row.attackFeasibilityEquipment) : 0;
            return attackFeasibilityElapsed +
                attackFeasibilityExpertise +
                attackFeasibilityKnowledge +
                attackFeasibilityWindow +
                attackFeasibilityEquipment;
        } else {
            const attackFeasibilityElapsedAfter: number = row.attackFeasibilityElapsedAfter ? Number(row.attackFeasibilityElapsedAfter) : 0;
            const attackFeasibilityExpertiseAfter: number = row.attackFeasibilityExpertiseAfter ? Number(row.attackFeasibilityExpertiseAfter) : 0;
            const attackFeasibilityKnowledgeAfter: number = row.attackFeasibilityKnowledgeAfter ? Number(row.attackFeasibilityKnowledgeAfter) : 0;
            const attackFeasibilityWindowAfter: number = row.attackFeasibilityWindowAfter ? Number(row.attackFeasibilityWindowAfter) : 0;
            const attackFeasibilityEquipmentAfter: number = row.attackFeasibilityEquipmentAfter ? Number(row.attackFeasibilityEquipmentAfter) : 0;
            return attackFeasibilityElapsedAfter +
                attackFeasibilityExpertiseAfter +
                attackFeasibilityKnowledgeAfter +
                attackFeasibilityWindowAfter +
                attackFeasibilityEquipmentAfter;
        }

    }
}