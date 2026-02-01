import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'analysisColor'
})
export class AnalysisColorPipe implements PipeTransform {

  transform(value) {
    switch (value) {
      case "Not started":
        return "red"

      case "In progress":
        return "yellow"

      case "Review required":
        return "orange"

      case "Completed":
      return "green"

      default:
        break;
    }
  }

}
