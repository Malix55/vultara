import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeDisable'
})
export class RemoveDisablePipe implements PipeTransform {

  transform(value, ...args: any[]) {// Only allow a goal to be removed from a threat if its added to it
    const goalId = value.id;
    const goals = args[0];
    const threatId = args[1];
    const index = goals.findIndex(goal => goal.id ===goalId);

    if(!goals[index]?.threatId.includes(threatId)){
      return false
    }else{
      return true;
    }
  }

}
