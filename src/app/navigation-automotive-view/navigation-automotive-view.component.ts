import { Component, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { DesignSettingsService } from '../services/design-settings.service';

@Component({
  selector: 'app-navigation-automotive-view',
  templateUrl: './navigation-automotive-view.component.html',
  styleUrls: ['./navigation-automotive-view.component.css']
})
export class NavigationAutomotiveViewComponent implements OnInit {
  projectName: any;
  color;
  constructor(private _router: Router, private _editDesignShared: DesignSettingsService,) { }

  @ViewChild("distributedActivities") distributedActivitiesMenu: MatMenuTrigger;
  @ViewChild("postDevelopment") postDevelopmentMenu: MatMenuTrigger;
  @ViewChild("concept") conceptMenu: MatMenuTrigger;
  @ViewChild("vv") vvMenu: MatMenuTrigger;
  @ViewChild("development") developmentMenu: MatMenuTrigger;
  @ViewChild("continualCybersecurity") continualCybersecurityMenu: MatMenuTrigger;
  @ViewChild("organizationalCybersecurity") organizationalCybersecurityMenu: MatMenuTrigger;
  @ViewChild("projectCybersecurity") projectCybersecurityMenu: MatMenuTrigger;

  distributedActivitiesFlag: boolean = false;
  postDevelopmentFlag: boolean = false;
  conceptFlag: boolean = false;
  vvFlag: boolean = false;
  developmentFlag: boolean = false;
  continualCybersecurityFlag: boolean = false;
  organizationalCybersecurityFlag: boolean = false;
  projectCybersecurityFlag: boolean = false;

  distributedActivitiesMenuTimer;
  postDevelopmentMenuTimer;
  conceptMenuTimer;
  vvMenuTimer
  developmentMenuTimer
  continualCybersecurityMenuTimer
  organizationalCybersecurityMenuTimer;
  projectCybersecurityMenuTimer
  disabledButtons = [{ name: "Distributed activities", disabled: false }, { name: "Post-development", disabled: false }, { name: "Concept", disabled: false }, { name: "V&V", disabled: false }, { name: "Development", disabled: false }, { name: "Continual cybersecurity activities", disabled: false }, { name: "Organizational cybersecurity management", disabled: false }, { name: "Project cybersecurity management", disabled: false },]

  ngOnInit() {
    this.projectName = this._editDesignShared.getProjectProperty("name");
  }

  openDistributedActivitiesMenu() {
    this.distributedActivitiesFlag = true
    this.closeOtherDropDowns(0)
    this.distributedActivitiesMenu.openMenu();
    window.clearTimeout(this.distributedActivitiesMenuTimer)
  }

  closeDistributedActivitiesMenu() {
    this.distributedActivitiesFlag = false
    this.distributedActivitiesMenuTimer = setTimeout(() => {
      if (this.distributedActivitiesFlag === false) {
        this.distributedActivitiesMenu.closeMenu();
      }
    }, 2000);
  }
  openPostDevelopmentMenu() {
    this.closeOtherDropDowns(1)
    this.postDevelopmentFlag = true
    this.postDevelopmentMenu.openMenu();
    window.clearTimeout(this.postDevelopmentMenuTimer)
  }

  closePostDevelopmentMenu() {
    this.postDevelopmentFlag = false
    this.postDevelopmentMenuTimer = setTimeout(() => {
      if (this.postDevelopmentFlag === false) {
        this.postDevelopmentMenu.closeMenu();
      }
    }, 2000);
  }

  openConceptMenu() {
    this.closeOtherDropDowns(2)
    this.conceptFlag = true
    this.conceptMenu.openMenu();
    window.clearTimeout(this.conceptMenuTimer)
  }

  closeConceptMenu() {
    this.conceptFlag = false
    this.conceptMenuTimer = setTimeout(() => {
      if (this.conceptFlag === false) {
        this.conceptMenu.closeMenu();
      }
    }, 2000);
  }

  openvvMenu() {
    this.closeOtherDropDowns(3)
    this.vvFlag = true
    this.vvMenu.openMenu();
    window.clearTimeout(this.vvMenuTimer)
  }

  closevvMenu() {
    this.vvFlag = false
    this.vvMenuTimer = setTimeout(() => {
      if (this.vvFlag === false) {
        this.vvMenu.closeMenu();
      }
    }, 2000);
  }

  openDevelopmentMenu() {
    this.closeOtherDropDowns(4)
    this.developmentFlag = true
    this.developmentMenu.openMenu();
    window.clearTimeout(this.developmentMenuTimer)
  }

  closeDevelopmentMenu() {
    this.developmentFlag = false
    this.developmentMenuTimer = setTimeout(() => {
      if (this.developmentFlag === false) {
        this.developmentMenu.closeMenu();
      }
    }, 2000);
  }



  openContinualCybersecurityMenu() {
    this.closeOtherDropDowns(5)
    this.continualCybersecurityFlag = true
    this.continualCybersecurityMenu.openMenu();
    window.clearTimeout(this.continualCybersecurityMenuTimer)
  }

  closeContinualCybersecurityMenu() {
    this.continualCybersecurityFlag = false
    this.continualCybersecurityMenuTimer = setTimeout(() => {
      if (this.continualCybersecurityFlag === false) {
        this.continualCybersecurityMenu.closeMenu();
      }
    }, 2000);
  }
  openOrganizationalCybersecurityMenu() {
    this.closeOtherDropDowns(6)
    this.organizationalCybersecurityFlag = true
    this.organizationalCybersecurityMenu.openMenu();
    window.clearTimeout(this.organizationalCybersecurityMenuTimer)
  }

  closeOrganizationalCybersecurityMenu() {
    this.organizationalCybersecurityFlag = false
    this.organizationalCybersecurityMenuTimer = setTimeout(() => {
      if (this.organizationalCybersecurityFlag === false) {
        this.organizationalCybersecurityMenu.closeMenu();
      }
    }, 2000);
  }

  openProjectCybersecurityMenu() {
    this.closeOtherDropDowns(7)
    this.projectCybersecurityFlag = true
    this.projectCybersecurityMenu.openMenu();
    window.clearTimeout(this.projectCybersecurityMenuTimer)
  }

  closeProjectCybersecurityMenu() {
    this.projectCybersecurityFlag = false
    this.projectCybersecurityMenuTimer = setTimeout(() => {
      if (this.projectCybersecurityFlag === false) {
        this.projectCybersecurityMenu.closeMenu();
      }
    }, 2000);
  }

  navigateToRoute(route) {
    this._router.navigateByUrl(route);
  }

  closeOtherDropDowns(number) {
    if (this.distributedActivitiesMenu.menuOpen.valueOf() && number !== 0) {
      this.distributedActivitiesMenu.closeMenu()
    }
    if (this.postDevelopmentMenu.menuOpen.valueOf() && number !== 1) {
      this.postDevelopmentMenu.closeMenu()
    }
    if (this.conceptMenu.menuOpen.valueOf() && number !== 2) {
      this.conceptMenu.closeMenu()
    }
    if (this.vvMenu.menuOpen.valueOf() && number !== 3) {
      this.vvMenu.closeMenu()
    }
    if (this.developmentMenu.menuOpen.valueOf() && number !== 4) {
      this.developmentMenu.closeMenu()
    }
    if (this.continualCybersecurityMenu.menuOpen.valueOf() && number !== 5) {
      this.continualCybersecurityMenu.closeMenu()
    }
    if (this.organizationalCybersecurityMenu.menuOpen.valueOf() && number !== 6) {
      this.organizationalCybersecurityMenu.closeMenu()
    }
    if (this.projectCybersecurityMenu.menuOpen.valueOf() && number !== 7) {
      this.projectCybersecurityMenu.closeMenu()
    }
  }
}
