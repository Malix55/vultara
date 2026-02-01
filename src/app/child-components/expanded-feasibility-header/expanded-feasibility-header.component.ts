import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

export enum TreatmentType {
  NoTreatment = 'no treatment'
}

export enum ChoiceType {
  Default = 'default',
  Org = 'org'
}

export enum ChoiceTypeLabel {
  Default = "Default",
  Org = "Organization's choice"
}

export enum ChoiceTypeTooltip {
  Default = 'Default: based on our threat feasibility database',
  Org = 'Organization’s choice: (this organization’s most favorable feasibility combination)'
}

@Component({
  selector: 'app-expanded-feasibility-header',
  templateUrl: './expanded-feasibility-header.component.html',
  styleUrls: ['./expanded-feasibility-header.component.css']
})
export class ExpandedFeasibilityHeaderComponent implements OnChanges, OnInit {
  @Input() threat: ThreatItem;

  public TreatmentType = TreatmentType;
  public enableNextStep: boolean = false;
  public currentChoice: string = ChoiceType.Default;
  public currentChoiceLabel: string = ChoiceTypeLabel.Default;
  public currentChoiceTooltip: string = ChoiceTypeTooltip.Default;

  constructor() { }

  ngOnChanges(): void {
    this.checkChoiceEnabled(this.threat);
  }

  ngOnInit(): void { }

  // Check whether user/org choice threat properties are enabled and preview button is clickable
  private checkChoiceEnabled(threat: ThreatItem) {
    if (threat.attackFeasibilityElapsedAiUser || threat.attackFeasibilityExpertiseAiUser ||
      threat.attackFeasibilityKnowledgeAiUser || threat.attackFeasibilityWindowAiUser || threat.attackFeasibilityEquipmentAiUser ||
      threat.attackFeasibilityElapsedRationaleAiUser || threat.attackFeasibilityExpertiseRationaleAiUser ||
      threat.attackFeasibilityKnowledgeRationaleAiUser || threat.attackFeasibilityWindowRationaleAiUser ||
      threat.attackFeasibilityEquipmentRationaleAiUser || threat.attackFeasibilityElapsedAiOrg || threat.attackFeasibilityExpertiseAiOrg ||
      threat.attackFeasibilityKnowledgeAiOrg || threat.attackFeasibilityWindowAiOrg || threat.attackFeasibilityEquipmentAiOrg ||
      threat.attackFeasibilityElapsedRationaleAiOrg || threat.attackFeasibilityExpertiseRationaleAiOrg || threat.attackFeasibilityKnowledgeRationaleAiOrg ||
      threat.attackFeasibilityWindowRationaleAiOrg || threat.attackFeasibilityEquipmentRationaleAiOrg
    ) {
      this.enableNextStep = true;
    } else {
      this.enableNextStep = false;
    }
  }

  // Move to next choice after clicking on slideshow icon
  public moveToNextFeasibilityChoice() {
    switch (this.currentChoice) {
      case ChoiceType.Default:
        this.currentChoice = ChoiceType.Org;
        this.currentChoiceLabel = ChoiceTypeLabel.Org;
        this.currentChoiceTooltip = ChoiceTypeTooltip.Org;
        break;
      case ChoiceType.Org:
        this.currentChoice = ChoiceType.Default;
        this.currentChoiceLabel = ChoiceTypeLabel.Default;
        this.currentChoiceTooltip = ChoiceTypeTooltip.Default;
        break;
    }
  }

}
