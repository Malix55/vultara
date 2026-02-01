import { AuthenticationService, UserProfile } from './services/authentication.service';
import { Router } from '@angular/router';
import { ComponentVisualChangeService } from './services/component-visual-change.service';
import { DesignSettingsService } from './services/design-settings.service';
import { NavbarComponent } from './navbar/navbar.component';
import { ArrOpService } from './services/arr-op.service';
import { ComponentMicro, ComponentControlUnit, ComponentCommLine, ComponentList, ComponentBoundary, ProjectType, CybersecurityGoal } from './../threatmodel/ItemDefinition';
import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { PropertyPanelComponent } from './property-panel/property-panel.component';
import { CybersecurityGoalService } from './services/cybersecurity-goal.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { SystemConfigService } from './services/system-config.service';
import { NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})


export class AppComponent implements OnInit {
  public project: ProjectType = { id: "" };
  public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  public newDesign = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);   // newDesign is the list of all components to document what's on the canvas
  public newDesignShared = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);   // newDesign is the list of all components to document what's on the canvas

  readonly systemConfigRootUrl = environment.backendApiUrl + "config";

  activeComponentId: string = "";
  currentUserProfile: UserProfile = {
    isAuth: false,
  };
  constructor(public ArrOp: ArrOpService, private _editDesignShared: DesignSettingsService, private _compVisual: ComponentVisualChangeService,
    private _router: Router, private _authService: AuthenticationService, private cybersecurityGoalService: CybersecurityGoalService,
    private http: HttpClient, private systemConfigService: SystemConfigService, private _spinner: NgxSpinnerService) {
  };

  ngOnInit() {
    this._editDesignShared.loadLocalStorage(this.microList, this.controlUnitList, this.lineList, this.boundaryList); // load newDesign from localStorage
    this.getCybersecurityGoals();
    if(this._authService.isLoggedIn()){
        this.getSystemConfigData();
    }


    this._authService.currentUserObservable.subscribe((currentUser) => this.currentUserProfile = currentUser);
    // if (!this._authService.isLoggedIn()) {
    //   this._router.navigateByUrl("/login");        
    // }

    this._editDesignShared.addToDesign.subscribe((designData) => this.newDesignShared = designData);
    this._editDesignShared.sidePanelStatus.subscribe((status) => this.sidePanelOpened = status);
  }
  sidePanelOpened = false;

  // Load Cybersecurity goal at the begining of application loaded
  private getCybersecurityGoals() {
    const goals: CybersecurityGoal[] = JSON.parse(localStorage.getItem("goal"));
    this.cybersecurityGoalService.updateCybersecurityGoals(goals ? goals : []);
  }

  // Get system config data when first loading the application
  private getSystemConfigData() {
    this._spinner.show();
    this.http
      .get(this.systemConfigRootUrl + "/systemconfig")
      .pipe(take(1))
      .subscribe((res: any) => {
        this._spinner.hide();
        if (res) {
          this.systemConfigService.systemData = res;
        }
      })
  }


}
