import { Pipe, PipeTransform } from '@angular/core';
import { MitreAttackService } from '../services/mitre-attack.service';

@Pipe({
  name: 'disableMerge',
  pure: false
})
export class DisableMergePipe implements PipeTransform {

  constructor(
    private mitreAttackService: MitreAttackService
  ) { }

  transform(mitreAttackBottomPanelType: string, ...args: unknown[]): unknown {
    switch (mitreAttackBottomPanelType) {
      case "ATTACK":
        return this.mitreAttackService.tacticsThreats.reduce((sum, _) => sum + _.threats.length , 0) < 2
      case "Control":
        if (this.mitreAttackService.mitreControlBeforeThreat?.id!== this.mitreAttackService.mitreControlAfterThreat?.id) {
          return false;
        }

        return true;

      default:
        break;
    }
  }

}
