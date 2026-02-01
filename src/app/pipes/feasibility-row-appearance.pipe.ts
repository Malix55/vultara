import { Pipe, PipeTransform } from '@angular/core';
import { FeasibilityEnumeratePipe } from './feasibility-enumerate';
import { FeasibilityTextPipe } from './feasibility-text';

export enum FeasibilityValue {
  Numeric = "Numeric",
  Enumerate = "Enumerate"
}

export enum FeasibilityType {
  Elapsed = "elapsed",
  Expertise = "expertise",
  Knowledge = "knowledge",
  Window = "window",
  Equipment = "equipment"
}

@Pipe({
  name: 'feasibilityRowAppearance',
  pure: false
})
export class FeasibilityRowAppearancePipe implements PipeTransform {

  transform(feasibilityValue: string, ...args: any[]): unknown {
    const notification: any = args[0];
    const rubricsValue: any = args[1];
    const feasibilityType: string = args[2];
    // if (notification.rejectStatus) return false;
    switch (feasibilityValue) {
      case FeasibilityValue.Enumerate:
        const feasibilityEnumeratePipe = new FeasibilityEnumeratePipe();
        const feasibilityTextPipe = new FeasibilityTextPipe();
        switch (feasibilityType) {
          case FeasibilityType.Elapsed:
            const elapsedValue = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityElapsed]);
            const elapsedFeasibilityText = feasibilityTextPipe.transform(elapsedValue);

            const elapsedValueUpdated = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityElapsedUpdated]);
            const elapsedFeasibilityTextUpdated = feasibilityTextPipe.transform(elapsedValueUpdated);
            if (elapsedFeasibilityText && elapsedFeasibilityTextUpdated && elapsedFeasibilityText !== elapsedFeasibilityTextUpdated)
              return true;
            else
              return false;
          case FeasibilityType.Expertise:
            const expertiseValue = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityExpertise]);
            const expertiseFeasibilityText = feasibilityTextPipe.transform(expertiseValue);

            const expertiseValueUpdated = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityExpertiseUpdated]);
            const expertiseFeasibilityTextUpdated = feasibilityTextPipe.transform(expertiseValueUpdated);
            if (expertiseFeasibilityText && expertiseFeasibilityTextUpdated && expertiseFeasibilityText !== expertiseFeasibilityTextUpdated)
              return true;
            else
              return false;
          case FeasibilityType.Knowledge:
            const knowledgeValue = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityKnowledge]);
            const knowledgeFeasibilityText = feasibilityTextPipe.transform(knowledgeValue);

            const knowledgeValueUpdated = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityKnowledgeUpdated]);
            const knowledgeFeasibilityTextUpdated = feasibilityTextPipe.transform(knowledgeValueUpdated);
            if (knowledgeFeasibilityText && knowledgeFeasibilityTextUpdated && knowledgeFeasibilityText !== knowledgeFeasibilityTextUpdated)
              return true;
            else
              return false;
          case FeasibilityType.Window:
            const windowValue = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityWindow]);
            const windowFeasibilityText = feasibilityTextPipe.transform(windowValue);

            const windowValueUpdated = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityWindowUpdated]);
            const windowFeasibilityTextUpdated = feasibilityTextPipe.transform(windowValueUpdated);
            if (windowFeasibilityText && windowFeasibilityTextUpdated && windowFeasibilityText !== windowFeasibilityTextUpdated)
              return true;
            else
              return false;
          case FeasibilityType.Equipment:
            const equipmentValue = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityEquipment]);
            const equipmentFeasibilityText = feasibilityTextPipe.transform(equipmentValue);

            const equipmentValueUpdated = feasibilityEnumeratePipe.transform(rubricsValue, [notification.attackFeasibilityEquipmentUpdated]);
            const equipmentFeasibilityTextUpdated = feasibilityTextPipe.transform(equipmentValueUpdated);
            if (equipmentFeasibilityText && equipmentFeasibilityTextUpdated && equipmentFeasibilityText !== equipmentFeasibilityTextUpdated)
              return true;
            else
              return false;
          default:
            break;
        }
        break;

      case FeasibilityValue.Numeric:
        switch (feasibilityType) {
          case FeasibilityType.Elapsed:
            if (notification.attackFeasibilityElapsed >= 0 &&
              notification.attackFeasibilityElapsedUpdated >= 0 &&
              Number(notification.attackFeasibilityElapsed) != Number(notification.attackFeasibilityElapsedUpdated)) {
              return true;
            }
            return false;
          case FeasibilityType.Expertise:
            if (notification.attackFeasibilityExpertise >= 0 &&
              notification.attackFeasibilityExpertiseUpdated >= 0 &&
              Number(notification.attackFeasibilityExpertise) != Number(notification.attackFeasibilityExpertiseUpdated)) {
              return true;
            }
            return false;
          case FeasibilityType.Knowledge:
            if (notification.attackFeasibilityKnowledge >= 0 &&
              notification.attackFeasibilityKnowledgeUpdated >= 0 &&
              notification.attackFeasibilityKnowledge != notification.attackFeasibilityKnowledgeUpdated) {
              return true;
            }
            return false;
          case FeasibilityType.Window:
            if (notification.attackFeasibilityWindow >= 0 &&
              notification.attackFeasibilityWindowUpdated >= 0 &&
              notification.attackFeasibilityWindow != notification.attackFeasibilityWindowUpdated) {
              return true;
            }
            return false;
          case FeasibilityType.Equipment:
            if (notification.attackFeasibilityEquipment >= 0 &&
              notification.attackFeasibilityEquipmentUpdated >= 0 &&
              notification.attackFeasibilityEquipment != notification.attackFeasibilityEquipmentUpdated) {
              return true;
            }
            return false;
          default:
            break;
        }

      default:
        break;
    }
    return false;
  }

}
