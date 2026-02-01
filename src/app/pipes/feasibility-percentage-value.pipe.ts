import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';
import { FeasibilityEnumeratePipe } from './feasibility-enumerate';

@Pipe({
  name: 'feasibilityPercentageValue',
  pure: false
})
export class FeasibilityPercentageValuePipe implements PipeTransform {

  transform(threat: ThreatItem, ...args: any[]): any {
    const feasibilityRatingAPRubrics: any = args[0];
    const type: string = args[1];
    const treatmentType: string = args[2];
    switch (type) {
      case "time":
        return this.getTimeProperty(threat, feasibilityRatingAPRubrics.time, treatmentType);
      case "expertise":
        return this.getExpertiseProperty(threat, feasibilityRatingAPRubrics.expertise, treatmentType);
      case "knowledge":
        return this.getKnowledgeProperty(threat, feasibilityRatingAPRubrics.knowledge, treatmentType);
      case "window":
        return this.getWindowProperty(threat, feasibilityRatingAPRubrics.window, treatmentType);
      case "equipment":
        return this.getEquipmentProperty(threat, feasibilityRatingAPRubrics.equipment, treatmentType);

      default:
        break;
    }
    return null;
  }

  // Get equipment feasibility percentage value and defined css color. Access threat property according to treatment value.
  private getEquipmentProperty(threat: ThreatItem, equipment: any, treatmentType: string) {
    const feasibilityEnumeratePipe = new FeasibilityEnumeratePipe();
    const value = feasibilityEnumeratePipe.transform(equipment, [treatmentType === "no treatment" ? threat.attackFeasibilityEquipment : threat.attackFeasibilityEquipmentAfter]);
    let data: any = {};

    switch (value) {
      case "bespoke":
        data = {
          value: 50,
          class: "yellow-percentage"
        };
        break;
      case "multipleBespoke":
        data = {
          value: 25,
          class: "green-percentage"
        };
        break;
      case "specialized":
        data = {
          value: 75,
          class: "magenta-percentage"
        };
        break;
      case "standard":
        data = {
          value: 100,
          class: "red-percentage"
        };
        break;
    }

    return data;
  }

  // Get window feasibility percentage value and defined css color. Access threat property according to treatment value.
  private getWindowProperty(threat: ThreatItem, window: any, treatmentType: string) {
    const feasibilityEnumeratePipe = new FeasibilityEnumeratePipe();
    const value = feasibilityEnumeratePipe.transform(window, [treatmentType === "no treatment" ? threat.attackFeasibilityWindow : threat.attackFeasibilityWindowAfter]);
    let data: any = {};

    switch (value) {
      case "difficult":
        data = {
          value: 25,
          class: "green-percentage"
        };
        break;
      case "easy":
        data = {
          value: 75,
          class: "magenta-percentage"
        };
        break;
      case "moderate":
        data = {
          value: 50,
          class: "yellow-percentage"
        };
        break;
      case "unlimited":
        data = {
          value: 100,
          class: "red-percentage"
        };
        break;
    }

    return data;
  }

  // Get knowledge feasibility percentage value and defined css color. Access threat property according to treatment value.
  private getKnowledgeProperty(threat: ThreatItem, knowledge: any, treatmentType: string) {
    const feasibilityEnumeratePipe = new FeasibilityEnumeratePipe();
    const value = feasibilityEnumeratePipe.transform(knowledge, [treatmentType === "no treatment" ? threat.attackFeasibilityKnowledge : threat.attackFeasibilityKnowledgeAfter]);
    let data: any = {};

    switch (value) {
      case "confidential":
        data = {
          value: 50,
          class: "yellow-percentage"
        };
        break;
      case "public":
        data = {
          value: 100,
          class: "red-percentage"
        };
        break;
      case "restricted":
        data = {
          value: 75,
          class: "magenta-percentage"
        };
        break;
      case "strictlyConfidential":
        data = {
          value: 25,
          class: "green-percentage"
        };
        break;
    }

    return data;
  }

  // Get expertise feasibility percentage value and defined css color. Access threat property according to treatment value.
  private getExpertiseProperty(threat: ThreatItem, expertise: any, treatmentType: string) {
    const feasibilityEnumeratePipe = new FeasibilityEnumeratePipe();
    const value = feasibilityEnumeratePipe.transform(expertise, [treatmentType === "no treatment" ? threat.attackFeasibilityExpertise : threat.attackFeasibilityExpertiseAfter]);
    let data: any = {};

    switch (value) {
      case "expert":
        data = {
          value: 50,
          class: "yellow-percentage"
        };
        break;
      case "layman":
        data = {
          value: 100,
          class: "red-percentage"
        };
        break;
      case "multipleExpert":
        data = {
          value: 25,
          class: "green-percentage"
        };
        break;
      case "proficient":
        data = {
          value: 75,
          class: "magenta-percentage"
        };
        break;
    }

    return data;
  }

  // Get time feasibility percentage value and defined css color. Access threat property according to treatment value.
  private getTimeProperty(threat: ThreatItem, time: any, treatmentType: string) {
    const feasibilityEnumeratePipe = new FeasibilityEnumeratePipe();
    const value = feasibilityEnumeratePipe.transform(time, [treatmentType === "no treatment" ? threat.attackFeasibilityElapsed : threat.attackFeasibilityElapsedAfter]);
    let data: any = {};

    switch (value) {
      case "1Day":
        data = {
          value: 100,
          class: "red-percentage"
        };
        break;
      case "1Month":
        data = {
          value: 60,
          class: "yellow-percentage"
        };
        break;
      case "1Week":
        data = {
          value: 80,
          class: "magenta-percentage"
        };
        break;
      case "6Months":
        data = {
          value: 40,
          class: "yellow-percentage"
        };
        break;
      case "moreThan6Months":
        data = {
          value: 20,
          class: "green-percentage"
        };
        break;
    }

    return data;
  }

}
