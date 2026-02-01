import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityTime'
})

export class FeasibilityTimePipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        switch (value) {
            case "1Day":
                return "≤ 1 day";
            case "1Week":
                return "≤ 1 week​";
            case "1Month":
                return "≤ 1 month";
            case "6Months":
                return "≤ 6 months​";
            case "moreThan6Months":
                return "> 6 months";
            default:
                return value;
        }
    }
}