import { Pipe, PipeTransform } from '@angular/core';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';
import { ImpactLevelNamePipe } from './impact-level-name';

@Pipe({
  name: 'modelingThreatsTooltip',
  pure: false
})
export class ModelingThreatsTooltipPipe implements PipeTransform {

  transform(threat: ThreatItem, ...args: any[]): unknown {
    const config = args[0];
    let imapctLevelNamePipe = new ImpactLevelNamePipe();
    const impact: string = (threat.treatment == 'no treatment') ?
      imapctLevelNamePipe.transform(config.impactLevelName, config.impactAggMethod, threat.impactSLevel, threat.impactFLevel, threat.impactOLevel, threat.impactPLevel) :
      (threat.impactSLevelAfter) ?
        imapctLevelNamePipe.transform(config.impactLevelName, config.impactAggMethod, threat.impactSLevelAfter, threat.impactFLevelAfter, threat.impactOLevelAfter, threat.impactPLevelAfter) :
        imapctLevelNamePipe.transform(config.impactLevelName, config.impactAggMethod, threat.impactSLevel, threat.impactFLevel, threat.impactOLevel, threat.impactPLevel);
    const feasibility: string = threat.attackFeasibilityLevelAfter ? threat.attackFeasibilityLevelAfter : threat.attackFeasibilityLevel;
    return `Impact: ${impact};
            Feasibility: ${feasibility};
            Threat Scenario: ${threat.threatScenario};
            Damage Scenario: ${threat.damageScenario};`;
  }

}
