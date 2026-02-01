import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TacticInterface } from 'src/threatmodel/ItemDefinition';
import { MitreAttackService } from 'src/app/services/mitre-attack.service';

@Component({
  selector: 'app-tactic-technique',
  templateUrl: './tactic-technique.component.html',
  styleUrls: ['./tactic-technique.component.css']
})
export class TacticTechniqueComponent implements OnInit {
  public techniques: TacticInterface[] = [];
  public techniqueVId: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<TacticTechniqueComponent>,
    public mitreAttackService: MitreAttackService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.techniqueVId = this.data.techniqueVId.filter((_: number) => _ !== -1);
    this.techniques = this.mitreAttackService.techniques.filter((_: TacticInterface) => _.tactic.includes(this.data.tacticVId));
    if (this.techniqueVId.length > 0) {
      this.techniqueVId.forEach((_: number) => {
        this.techniques.sort((x, y) => x.vId === _ ? -1 : y.vId === _ ? 1 : 0);
      });
    }
  }

  // Select a technique and close the dialog via sending related information to parent component
  selectTechnique(vId: number) {
    const tacticInformation = {
      tacticColumnIndex: this.data.tacticColumnIndex,
      threatIndex: this.data.threatIndex,
      techniqueVId: vId,
      tacticVId: this.data.tacticVId
    };
    this.dialogRef.close(tacticInformation);
  }

}
