import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'selectedTechnique'
})

export class SelectedTechniquePipe implements PipeTransform {
    transform(techniqueVId: any, ...args: any[]): any {
        const vId: number = args[0];
        if(techniqueVId.includes(vId)){
            return "primary";
        } else {
            return "default";
        }
    }
}