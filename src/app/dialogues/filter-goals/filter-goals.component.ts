import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CybersecurityGoal } from 'src/threatmodel/ItemDefinition';

@Component({
  selector: 'app-filter-goals',
  templateUrl: './filter-goals.component.html',
  styleUrls: ['./filter-goals.component.css']
})
export class FilterGoalsComponent implements OnInit {
  public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  public displayedColumns: string[] = ['select', 'serial', 'goal'];
  public selectedGoals: CybersecurityGoal[] = [];

  constructor(
    public dialogRef: MatDialogRef<FilterGoalsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.dataSource.data = this.data.goals;
  }

  // Close the popup and send selected goals
  public confirmCybersecurityGoals() {
    this.dialogRef.close(this.selectedGoals);
  }

  // Select goals to apply filter in threat list
  public selectGoal(checked: boolean, id: string) {
    if (checked) {
      const goal: CybersecurityGoal = this.data.goals.find((_: CybersecurityGoal) => _.id === id)
      if (this.selectedGoals.findIndex((_: CybersecurityGoal) => _.id === id) === -1) {
        this.selectedGoals.push(goal);
      }
    } else {
      this.selectedGoals = this.selectedGoals.filter((_: CybersecurityGoal) => _.id !== id);
    }
  }

}
