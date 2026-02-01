import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { DesignSettingsService } from 'src/app/services/design-settings.service';
import { Wp29ThreatService } from 'src/app/services/wp29-threat.service';
import { environment } from 'src/environments/environment';
import { ThreatItem } from 'src/threatmodel/ItemDefinition';

@Component({
  selector: 'app-wp29-threat-mapping',
  templateUrl: './wp29-threat-mapping.component.html',
  styleUrls: ['./wp29-threat-mapping.component.css']
})
export class Wp29ThreatMappingComponent implements OnInit {
  public totalSteps: number = 11;
  public stepsCompleted: boolean = false;
  public currrentStep: string = "15.1";
  public currrentStepCount: number = 1;
  public hardCodedThreats: ThreatItem[] = [];
  public notApplicableWP29AttackIndex: string[] = [];
  public threatsToUpdate: ThreatItem[] = [];
  public indexEighteenPointTwo: string = "18.2.1";
  public indexTwentyNinePointOne: string = "29.1.1";
  public indexThirtyOnePointOne: string = "31.1.1";
  public closeConfirmationMode: boolean = false;
  public eighteenPointTwoSelectedModules: string[] = [];
  public eighteenPointTwoSelectedCommLines: any[] = [];
  public eighteenPointTwoSelectedCommLinesModules: any[] = [];
  public eighteenPointTwoModuleCommLines: any = {};
  public eighteenPointTwoSelectedModule: string = "";
  public eighteenPointTwoSelectedModuleIndex: number = 0;

  readonly featureRootUrl = environment.backendApiUrl + "features";

  constructor(
    public wp29ThreatService: Wp29ThreatService,
    public editDesignShared: DesignSettingsService,
    public dialogRef: MatDialogRef<Wp29ThreatMappingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.createDefaultHardCodedThreats(this.data.threats)
  }

  // Create hardcoded threats (those don't require user input) after executing "Map Threat List to WP29" action
  private createDefaultHardCodedThreats(threats: ThreatItem[] = []) {
    const wp29AttackIndex: string[] = ["4.2", "8.2", "9.1", "26.2", "26.3", "28.2", "32.1"];
    wp29AttackIndex.forEach((singleWP29AttackIndex: string) => {
      this.hardCodedThreats = [...this.hardCodedThreats, ...this.wp29ThreatService.getThreatForWP29AttackIndex(singleWP29AttackIndex, threats, this.hardCodedThreats, this.data.newDesign)];
      if (!this.notApplicableWP29AttackIndex.includes(singleWP29AttackIndex)) {
        const notApplicableWP29AttackIndex = this.wp29ThreatService.getNotApplicableWP29AttackIndex(this.data.newDesign, singleWP29AttackIndex);
        if (notApplicableWP29AttackIndex) {
          this.notApplicableWP29AttackIndex = [...this.notApplicableWP29AttackIndex, notApplicableWP29AttackIndex];
        }
      }
    });
  }

  // Move forward to next step until user reaches to final confirmation pop-up
  public selectedIndex(wp29AttackIndex: string, nextwp29AttackIndex: string) {
    if (wp29AttackIndex && wp29AttackIndex !== "0") {
      this.hardCodedThreats = [...this.hardCodedThreats, ...this.wp29ThreatService.getThreatForWP29AttackIndex(wp29AttackIndex, this.data.threats, this.hardCodedThreats)];
      this.skippedAndNextOption(nextwp29AttackIndex);
    }
  }

  // Move forward to next sub-step within a step
  public selectSubIndex(step: string, subStep: string) {
    switch (step) {
      case "18.2":
        this.indexEighteenPointTwo = subStep;
        break;
      case "29.1":
        this.indexTwentyNinePointOne = subStep;
        break;
      case "31.1":
        this.indexThirtyOnePointOne = subStep;
        break;

      default:
        break;
    }
  }

  // Skip current step and move forward to next step (after "No" button selection)
  public skippedAndNextOption(wp29AttackIndex?: string, previousWP29AttackIndex?: string) {
    if (previousWP29AttackIndex) {
      switch (previousWP29AttackIndex) {
        case "15.1":
        case "15.2":
        case "17.1":
        case "18.2":
        case "19.2":
        case "20.1":
        case "20.2":
        case "20.3":
        case "29.1":
        case "29.2":
          if (!this.notApplicableWP29AttackIndex.includes(previousWP29AttackIndex)) {
            this.notApplicableWP29AttackIndex = [...this.notApplicableWP29AttackIndex, previousWP29AttackIndex];
          }
          break;

        default:
          break;
      }
    }
    if (wp29AttackIndex) {
      this.currrentStep = wp29AttackIndex;
      this.currrentStepCount = this.currrentStepCount + 1;
    }
  }

  // Abort the whole operation and close the pop-up window
  public abort() {
    this.dialogRef.close();
  }

  // Confirm the operation is done and send back newly created hardcoded threats
  public acknowledge() {
    this.dialogRef.close({ hardCodedThreats: this.hardCodedThreats, threatsToUpdate: this.threatsToUpdate, notApplicableWP29AttackIndex: this.notApplicableWP29AttackIndex });
  }

  // Modules selection for wp29AttackIndex - 18.2 and move forward to module connected commLine selection. If module selection is empty skip to next step.
  public selectEighteenPointTwoModules(selectedList: any, nextSubStep: string, nextStep: string) {
    const eighteenPointTwoSelectedModules: any[] = selectedList.selectedOptions.selected;
    this.indexEighteenPointTwo = nextSubStep;
    eighteenPointTwoSelectedModules.forEach((_: any) => {
      this.eighteenPointTwoSelectedModules.push(_.value);
    });
    if (this.eighteenPointTwoSelectedModules.length > 0) {
      this.eighteenPointTwoSelectedModule = this.eighteenPointTwoSelectedModules[this.eighteenPointTwoSelectedModuleIndex];
      this.eighteenPointTwoSelectedModuleIndex = this.eighteenPointTwoSelectedModuleIndex + 1;
    } else {
      this.skippedAndNextOption(nextStep);
    }
  }

  // Module connected commLine selection until all selected module's commLine selection is done. If done move to next step.
  public selectEighteenPointTwoCommLines(selectedList: MatSelectionList, selectedModuleId: any, currentStep: string, nextStep: string) {
    const commLines: any[] = [];
    if (selectedList) {
      const eighteenPointTwoSelectedCommLines: any[] = selectedList.selectedOptions.selected;
      if (eighteenPointTwoSelectedCommLines.length > 0) {
        this.eighteenPointTwoSelectedCommLinesModules.push(this.eighteenPointTwoSelectedModule);
      }
      eighteenPointTwoSelectedCommLines.forEach((_: any) => {
        const commLine: any = this.data.newDesign.commLine.find((__: any) => __.id === _.value);
        commLines.push(commLine);
        this.eighteenPointTwoSelectedCommLines.push(commLine);
      });

      this.eighteenPointTwoModuleCommLines[selectedModuleId] = commLines;
    }
    if (this.eighteenPointTwoSelectedModuleIndex < this.eighteenPointTwoSelectedModules.length) {
      this.eighteenPointTwoSelectedModule = this.eighteenPointTwoSelectedModules[this.eighteenPointTwoSelectedModuleIndex];
      this.eighteenPointTwoSelectedModuleIndex = this.eighteenPointTwoSelectedModuleIndex + 1;
    } else {
      if (this.eighteenPointTwoSelectedCommLinesModules.length > 0 && this.eighteenPointTwoSelectedCommLines.length > 0) {
        this.hardCodedThreats = [...this.hardCodedThreats, ...this.wp29ThreatService.getThreatForWP29AttackIndex(currentStep, this.data.threats, this.hardCodedThreats, this.data.newDesign, this.eighteenPointTwoSelectedCommLinesModules, this.eighteenPointTwoModuleCommLines)];
      }
      this.skippedAndNextOption(nextStep);
      this.eighteenPointTwoModuleCommLines = {};
    }
    selectedList.deselectAll();
  }

  // Select next sub/step when there is no commLine connected
  public selectEighteenPointTwoEmptyCommLines(currentStep: string, nextStep: string) {
    if (this.eighteenPointTwoSelectedModuleIndex < this.eighteenPointTwoSelectedModules.length) {
      this.eighteenPointTwoSelectedModule = this.eighteenPointTwoSelectedModules[this.eighteenPointTwoSelectedModuleIndex];
      this.eighteenPointTwoSelectedModuleIndex = this.eighteenPointTwoSelectedModuleIndex + 1;
    } else {
      this.hardCodedThreats = [...this.hardCodedThreats, ...this.wp29ThreatService.getThreatForWP29AttackIndex(currentStep, this.data.threats, this.hardCodedThreats, this.eighteenPointTwoSelectedModules, this.eighteenPointTwoSelectedCommLines)];
      this.skippedAndNextOption(nextStep);
    }
  }

  // Select commLines for wp29AttackIndex - 29.1 and create hard-coded threats from the selected commLines. Then move forward to next step
  public selectTwentyNinePointOneCommLines(selectedList: MatSelectionList, currentStep: string, nextStep: string) {
    const selectedCommLines: string[] = [];
    const twentyNinePointOneSelectedCommLines: any[] = selectedList.selectedOptions.selected;
    twentyNinePointOneSelectedCommLines.forEach((_: any) => {
      selectedCommLines.push(_.value);
    });
    this.hardCodedThreats = [...this.hardCodedThreats, ...this.wp29ThreatService.getThreatForWP29AttackIndex(currentStep, this.data.threats, this.hardCodedThreats, selectedCommLines, this.data.newDesign.commLine)];
    this.skippedAndNextOption(nextStep);
  }

  // Select assets for wp29AttackIndex - 31.1 and create hard-coded threats from the selected commLines. Then move forward to next step.
  public selectThirtyOnePointOneAssets(selectedList: MatSelectionList, currentStep: string, nextStep: string) {
    const selectedAssets: string[] = [];
    const thirtyOnePointOneSelectedAssets: any[] = selectedList.selectedOptions.selected;
    thirtyOnePointOneSelectedAssets.forEach((_: any) => {
      selectedAssets.push(_.value);
    });
    if (selectedAssets.length > 0) {
      this.threatsToUpdate = this.wp29ThreatService.getThreatForWP29AttackIndex(currentStep, this.data.threats, this.hardCodedThreats, selectedAssets);
      this.data.threats = [...this.data.threats.map((_: ThreatItem) => {
        const threatExists: ThreatItem = this.threatsToUpdate.find((__: ThreatItem) => __.id === _.id && __.threatRowNumber === _.threatRowNumber);
        if (threatExists) {
          return threatExists;
        } else {
          return _;
        }
      })];
    } else {
      if (!this.notApplicableWP29AttackIndex.includes(currentStep)) {
        this.notApplicableWP29AttackIndex = [...this.notApplicableWP29AttackIndex, currentStep];
      }
    }
    this.skippedAndNextOption(nextStep);
  }
}

