import { WP29Model } from './../../threatmodel/ItemDefinition';
import { Wp29ThreatService } from './../services/wp29-threat.service';
import { Pipe, PipeTransform } from '@angular/core';
import { DesignSettingsService } from '../services/design-settings.service';

@Pipe({
    name: 'threatMappingStatus'
})

export class ThreatMappingStatusPipe implements PipeTransform {
    constructor(private wp29ThreatService: Wp29ThreatService,private _editDesignShared: DesignSettingsService) { }

    transform(result: any, ...args: any[]): any {
        let notApplicableWP29AttackIndex=[];
        this._editDesignShared.addToDesign.subscribe(res=>notApplicableWP29AttackIndex=res.project.notApplicableWP29AttackIndex)
        const initialIndex: number = 0;
        const wp29: WP29Model = args[2].find((obj: WP29Model) => obj.wp29ThreatIndex === args[1]);
        if (wp29) {
            this.wp29ThreatService.mappingStatus[args[0]] = this.wp29ThreatService.getMappingStatusColor(wp29.mappingStatus);
            return this.wp29ThreatService.mappingStatus[args[0]];
        }
        const rowNumbers: number[] = this.wp29ThreatService.getThreatIndex(result, args[1], initialIndex, []);
        if (rowNumbers && rowNumbers.length > 0) {
            this.wp29ThreatService.mappingStatus[args[0]] = "green";
        } else if(notApplicableWP29AttackIndex.includes(args[1])){
            this.wp29ThreatService.mappingStatus[args[0]] = "orange";
        }
        else {
            this.wp29ThreatService.mappingStatus[args[0]] = "red";
        }

        return this.wp29ThreatService.mappingStatus[args[0]];
    }
}