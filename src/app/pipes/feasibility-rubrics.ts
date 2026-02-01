import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityRubrics'
})

export class FeasibilityRubricsPipe implements PipeTransform {
    transform(rubrics: any, ...args: any[]): any {
        let value: any[] = [];
        const time = Object.entries(rubrics.time);
        const expertise = Object.entries(rubrics.expertise);
        const knowledge = Object.entries(rubrics.knowledge);
        const equipment = Object.entries(rubrics.equipment);
        const window = Object.entries(rubrics.window);

        const lengthArray: number[] = [time.length,
        expertise.length,
        knowledge.length,
        equipment.length,
        window.length];
        const largeNumber: number = Math.max(...lengthArray);
        for (let i = 0; i < largeNumber; i++) {
            let obj = {
                timeEnumerate: time[i] ? time[i][0] : '',
                timeValue: time[i] ? time[i][1] : '',
                timePercentage: time[i] ? this.getTimePercentage(time[i][1]) : {},
                expertiseEnumerate: expertise[i] ? expertise[i][0] : '',
                expertiseValue: expertise[i] ? expertise[i][1] : '',
                expertisePercentage: expertise[i] ? this.getExpertisePercentage(expertise[i][1]) : {},
                knowledgeEnumerate: knowledge[i] ? knowledge[i][0] : '',
                knowledgeValue: knowledge[i] ? knowledge[i][1] : '',
                knowledgePercentage: knowledge[i] ? this.getKnowledgePercentage(knowledge[i][1]) : {},
                equipmentEnumerate: equipment[i] ? equipment[i][0] : '',
                equipmentValue: equipment[i] ? equipment[i][1] : '',
                equipmentPercentage: equipment[i] ? this.getEquipmentPercentage(equipment[i][1]) : {},
                windowEnumerate: window[i] ? window[i][0] : '',
                windowValue: window[i] ? window[i][1] : '',
                windowPercentage: window[i] ? this.getWindowPercentage(window[i][1]) : {},
            }

            value.push(obj);
        }
        return value;
    }

    // Get window percentage value and css class
    private getWindowPercentage(window: any) {
        switch (window) {
            case 0:
                return {
                    value: 100,
                    class: "red-percentage"
                }
            case 1:
                return {
                    value: 75,
                    class: "magenta-percentage"
                }
            case 4:
                return {
                    value: 50,
                    class: "yellow-percentage"
                }
            case 10:
                return {
                    value: 25,
                    class: "green-percentage"
                }
            default:
                break;
        }
    }

    // Get equipment percentage value and css class
    private getEquipmentPercentage(equipment: any) {
        switch (equipment) {
            case 0:
                return {
                    value: 100,
                    class: "red-percentage"
                }
            case 4:
                return {
                    value: 75,
                    class: "magenta-percentage"
                }
            case 7:
                return {
                    value: 50,
                    class: "yellow-percentage"
                }
            case 9:
                return {
                    value: 25,
                    class: "green-percentage"
                }
            default:
                break;
        }
    }

    // Get knowledge percentage value and css class
    private getKnowledgePercentage(knowledge: any) {
        switch (knowledge) {
            case 0:
                return {
                    value: 100,
                    class: "red-percentage"
                }
            case 3:
                return {
                    value: 75,
                    class: "magenta-percentage"
                }
            case 7:
                return {
                    value: 50,
                    class: "yellow-percentage"
                }
            case 11:
                return {
                    value: 25,
                    class: "green-percentage"
                }
            default:
                break;
        }
    }

    // Get time percentage value and css class
    private getTimePercentage(time: any) {
        switch (time) {
            case 0:
                return {
                    value: 100,
                    class: "red-percentage"
                }
            case 1:
                return {
                    value: 80,
                    class: "magenta-percentage"
                }
            case 4:
                return {
                    value: 60,
                    class: "yellow-percentage"
                }
            case 17:
                return {
                    value: 40,
                    class: "yellow-percentage"
                }
            case 19:
                return {
                    value: 20,
                    class: "green-percentage"
                }
            default:
                break;
        }
    }

    // Get expertise percentage value and css class
    private getExpertisePercentage(expertise: any) {
        switch (expertise) {
            case 0:
                return {
                    value: 100,
                    class: "red-percentage"
                }
            case 3:
                return {
                    value: 75,
                    class: "magenta-percentage"
                }
            case 6:
                return {
                    value: 50,
                    class: "yellow-percentage"
                }
            case 8:
                return {
                    value: 25,
                    class: "green-percentage"
                }
            default:
                break;
        }
    }
}