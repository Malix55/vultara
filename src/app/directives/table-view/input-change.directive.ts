import { ThreatItem } from '../../../threatmodel/ItemDefinition';
import { ResultSharingService } from '../../services/result-sharing.service';
import { Directive, Input } from '@angular/core';

@Directive({
    selector: '[inputchange]',
    providers: [ResultSharingService],
    host: {
        "(ngModelChange)": "onInputChange($event)"
    }
})
export class InputChangeDirective {
    @Input() row: any;
    @Input() property: string;
    @Input() result: ThreatItem[] = [];

    constructor(private _resultShared: ResultSharingService) { }

    //Updates the value of result for a specific index on input change
    onInputChange(event: any) {
        if (this.result.length > 0) {
            const index: number = this.result.findIndex(threat => threat.id === this.row.id);
            if(index > -1){                
                this.result[index][this.property] = event;
                this._resultShared.updateEntireResult(this.result);   
            }
        }
    }
}