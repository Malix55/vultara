import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityRating'
})

export class FeasibilityRatingPipe implements PipeTransform {
    transform(rating: any, ...args: any[]): any {
        const index: number = args[0];
        if(rating[index]){
            if(index === 0) {
                return `0 - ${rating[index]}`;
            }

            return `${rating[index - 1] + 1} - ${rating[index]}`
        }

        return `> ${rating[index - 1]}` ;
    }
}