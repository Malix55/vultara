import { SystemConfigurationViewComponent } from './../system-configuration-view/system-configuration-view.component';
import { DashboardViewComponent } from './../dashboard-view/dashboard-view.component';
import { DatabaseViewComponent } from './../database-view/database-view.component';
import { MaterialsViewComponent } from './../materials-view/materials-view.component';
import { AccountAdminComponent } from './../account-admin/account-admin.component';
import { AuthGuard } from './../services/auth.guard';
import { RegisterViewComponent } from './../register-view/register-view.component';
import { LoginViewComponent } from './../login-view/login-view.component';
import { HomeViewComponent } from './../home-view/home-view.component';
import { RootViewComponent } from './../root-view/root-view.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ModelingViewComponent } from '../modeling-view/modeling-view.component';
import { TableViewComponent } from './../table-view/table-view.component';
import { NotificationsDetailsComponent } from '../notifications/details/details.component';
import { CybersecurityGoalComponent } from '../cybersecurity-goal/cybersecurity-goal.component';
import { VulnerabilitiesComponent } from '../vulnerabilities/vulnerabilities.component';
import { AssumptionsComponent } from '../assumptions-view/assumptions-view.component';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { NavigationAutomotiveViewComponent } from '../navigation-automotive-view/navigation-automotive-view.component';
import { HelpComponent } from '../help/help.component';
import { HelpDetailComponent } from '../help/help-detail/help-detail.component';
import { WeaknessViewComponent } from '../weakness-view/weakness-view.component';
import { ControlViewComponent } from '../control-view/control-view.component';

const routes: Routes = [
  { path: "", component: RootViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "home", component: HomeViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "dashboard", component: DashboardViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "dashboard/:index", component: DashboardViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "modeling", component: ModelingViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "threats", component: TableViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "library", component: DatabaseViewComponent,
    canActivate: [AuthGuard],
    data: {
      role: ["Admin", "Super Admin", "Security Manager", "Security Engineer"]
    }
  },
  { path: "systemConfig", component: SystemConfigurationViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "materials", component: MaterialsViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "notifications", component: NotificationsDetailsComponent,
    canActivate: [AuthGuard],
  },
  { path: "navigation", component: NavigationAutomotiveViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "cybersecurity-goal", component: CybersecurityGoalComponent,
    canActivate: [AuthGuard],
  },
  { path: "login", component: LoginViewComponent},
  // { path: "register", component: RegisterViewComponent},
  { path: "accountAdmin", component: AccountAdminComponent,
    canActivate: [AuthGuard],
    data: {
      role: ["Admin", "Super Admin"]
    }
  },
  { path: "vulnerabilities", component: VulnerabilitiesComponent,
    canActivate: [AuthGuard],
  },
  { path: "weaknesses", component: WeaknessViewComponent,
    canActivate: [AuthGuard],
  },
  { path: "assumptions", component: AssumptionsComponent,
  canActivate: [AuthGuard],
},
  { path: "user-profile", component: EditProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path:"help",component:HelpComponent,
    canActivate:[AuthGuard],
  },
  {
    path:"helpdetail/:id",component:HelpDetailComponent,
    canActivate:[AuthGuard],
  },
  {
    path:"cybersecurity-control",component:ControlViewComponent,
    canActivate:[AuthGuard],
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [ModelingViewComponent, TableViewComponent]