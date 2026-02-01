import { ThreatMappingStatusPipe } from './pipes/threat-mapping-status';
import { Wp29ThreatService } from './services/wp29-threat.service';
import { ThreatRowNumbersPipe } from './pipes/threat-row';
import { DatabaseSubTypeStatusPipe } from './pipes/database-subtype-status';
import { DatabaseSubTypeValuePipe } from './pipes/database-subtype-value';
import { DatabaseSubTypePipe } from './pipes/database-subtype';
import { FeasibilityEnumeratePipe } from './pipes/feasibility-enumerate';
import { ObjectKeysPipe } from './pipes/object-keys';
import { ObjectsArrayPipe } from './pipes/objects-array';
import { InputChangeDirective } from './directives/table-view/input-change.directive';
import { FeasibilityTotalPipe } from './pipes/feasibility-total';
import { FeasibilityTextPipe } from './pipes/feasibility-text';
import { FeasibilityTimePipe } from './pipes/feasibility-time';
import { FeasibilityRubricsPipe } from './pipes/feasibility-rubrics';
import { FeasibilityIconPipe } from './pipes/feasibility-icon';
import { RiskTitlePipe } from './pipes/risk-title';
import { AddModifyArrayDialogService } from './services/add-modify-array-dialog.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { AuthenticationService } from './services/authentication.service';
import { HttpRequestInterceptor } from './services/http-request.interceptor';
import { ResultSharingService } from './services/result-sharing.service';
import { AppRoutingModule, routingComponents } from './app-routing/app-routing.module';
import { AppHttpService } from './services/app-http.service';
import { ComponentVisualChangeService } from './services/component-visual-change.service';
import { DesignSettingsService } from './services/design-settings.service';
import { NgmaterialModule } from './ngmaterial/ngmaterial.module';
import { NavbarComponent, LoadProjectDialog, DeleteProjectDialog, ShowMilestoneDialog, ChangePasswordDialog, NotCompatibleBrowserDialog, ProjectInfoDialog } from './navbar/navbar.component';
import { EditFeatureDialog } from './property-panel/property-panel.component';
import { ArrOpService } from './services/arr-op.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PropertyPanelComponent } from './property-panel/property-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RootViewComponent } from './root-view/root-view.component';
import { HomeViewComponent } from './home-view/home-view.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDatatableModule } from '@swimlane/ngx-datatable'
import { LoginViewComponent } from './login-view/login-view.component';
import { RegisterViewComponent } from './register-view/register-view.component';
import { AccountAdminComponent } from './account-admin/account-admin.component';
import { MaterialsViewComponent } from './materials-view/materials-view.component';
import { DatabaseViewComponent } from './database-view/database-view.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { AddModifyArrayDialogComponent } from './add-modify-array-dialog/add-modify-array-dialog.component';
import { SingleInputFormDialogComponent } from './single-input-form-dialog/single-input-form-dialog.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DashboardViewComponent } from './dashboard-view/dashboard-view.component';
import { SystemConfigurationViewComponent } from './system-configuration-view/system-configuration-view.component';
import { FeasibilityRatingPipe } from './pipes/feasibility-rating';
import { CreateModuleDialog } from './dialogues/create-module/create-module.component';
import { CreateAssetDialog } from './dialogues/create-asset/create-asset.component';
import { EditDeleteFeatureDialog } from './dialogues/edit-delete-feature/editdelete-feature.component';
import { FeatureSettingDialog } from './dialogues/feature-setting/feature-setting.component';
import { HighLevelThreatPipe } from './pipes/high-level-threat';
import { Wp29MappingDialogComponent } from './dialogues/wp29-mapping/wp29-mapping.component';
import { HighLevelThreatRowSpanPipe } from './pipes/high-level-threat-span';
import { HighLevelThreatCountPipe } from './pipes/high-level-threat-count';


import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { FeatureAssetsPipe } from './pipes/feature-assets';
import { AssetsIndeterminatePipe } from './pipes/feature-assets-indeterminate';
import { DeleteThreatComponent } from './dialogues/delete-threat/delete-threat.component';
import { ImpactLevelNamePipe } from './pipes/impact-level-name';
import { LoadMilestoneComponent } from './dialogues/load-milestone/load-milestone.component';
import { ProtocolsPipe } from './pipes/protocols';
import { MitreAttackComponent } from './dialogues/mitre-attack/mitre-attack.component';
import { FullscreenOverlayContainer, OverlayContainer } from '@angular/cdk/overlay';
import { OverlayModule } from '@angular/cdk/overlay';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MitreAttackTacticsPipe } from './pipes/mitre-attack-tactics';
import { MitreAttackDropZonesPipe } from './pipes/mitre-attack-drop-zones';
import { NotificationsDetailsComponent } from './notifications/details/details.component';
import { RiskUpdateComponent } from './dialogues/risk-update/risk-update.component';
import { CheckTodayPipe } from './pipes/check-today';
import { UnreadRiskNotificationPipe } from './pipes/unread-risk-notification';
import { NotificationRiskLevelPipe } from './pipes/notification-risk-level';
import { TacticTechniqueComponent } from './dialogues/tactic-technique/tactic-technique.component';
import { SelectedTechniquePipe } from './pipes/selected-technique';
import { TacticsThreatsPipe } from './pipes/mitre-attack-tactics-threats';
import { CreateBOMComponent } from './dialogues/create-bom/create-bom.component';
import { CybersecurityGoalSectionComponent } from './child-components/cybersecurity-goal/cybersecurity-goal.component';
import { ThreatFrameColumnsPipe } from './pipes/theat-frame-columns.pipe';
import { ResizeThreatNotePipe } from './pipes/resize-threat-note.pipe';
import { CybersecurityGoalDialogComponent } from './dialogues/cybersecurity-goal/cybersecurity-goal.component';
import { TextLengthPipe } from './pipes/text-length.pipe';
import { FilterGoalsComponent } from './dialogues/filter-goals/filter-goals.component';
import { CybersecurityGoalComponent } from './cybersecurity-goal/cybersecurity-goal.component';
import { ModelingResultsComponent } from './child-components/modeling-results/modeling-results.component';
import { ModelingThreatsPipe } from './pipes/modeling-threats.pipe';
import { ModelingThreatsTooltipPipe } from './pipes/modeling-threats-tooltip.pipe';
import { TrimTextPipe } from './pipes/trim-text.pipe';
import { GenerateReportComponent } from './dialogues/generate-report/generate-report.component';
import { Wp29ThreatMappingComponent } from './dialogues/wp29-threat-mapping/wp29-threat-mapping.component';
import { ModelModulesPipe } from './pipes/model-modules.pipe';
import { AssetsByTypePipe } from './pipes/assets-by-type.pipe';
import { Wp29EighteenpointtwoModulePipe } from './pipes/wp29-eighteenpointtwo-module.pipe';
import { ModuleConnectedCommlinesPipe } from './pipes/module-connected-commlines.pipe';
import { ModelCommlinesPipe } from './pipes/model-commlines.pipe';
import { RestoreThreatsComponent } from './dialogues/restore-threats/restore-threats.component';
import { ControlBeforeConfirmationComponent } from './dialogues/control-before-confirmation/control-before-confirmation.component';
import { ControlAfterConfirmationComponent } from './dialogues/control-after-confirmation/control-after-confirmation.component';
import { DisableMergePipe } from './pipes/disable-merge.pipe';
import { AssetPropertiesComponent } from './dialogues/asset-properties/asset-properties.component';
import { AssetPropertyActionPipe } from './pipes/asset-property-action.pipe';
import { ComponentFeatureAssetsPipe } from './pipes/component-feature-assets.pipe';
import { NewUserComponent } from './dialogues/new-user/new-user.component';
import { ExpandedFeasibilityHeaderComponent } from './child-components/expanded-feasibility-header/expanded-feasibility-header.component';
import { ExpandedImpactHeaderComponent } from './child-components/expanded-impact-header/expanded-impact-header.component';
import { FeasibilityPercentageValuePipe } from './pipes/feasibility-percentage-value.pipe';
import { ActiveComponentTypePipe } from './pipes/active-component-type.pipe';
import { MergeThreatConfirmationComponent } from './dialogues/merge-threat/merge-threat-confirmation.component';
import { VulnerabilitiesComponent } from './vulnerabilities/vulnerabilities.component';
import { DeleteVulnerabilityComponent } from './dialogues/delete-vulnerability/delete-vulnerability.component';
import { ActivateSaveButtonPipe } from './pipes/activate-save-button.pipe';
import { FeasibilityRowAppearancePipe } from './pipes/feasibility-row-appearance.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PreventDoubleClickDirective } from './directives/table-view/preventDoubleClick';
import { WhiteSpaceValidationPipe } from './pipes/white-space-validation.pipe';
import { AddUpdateVulnerabilityDialog } from './dialogues/add-update-vulnerability/add-update-vulnerability.component';
import { AddGoalDialog } from './dialogues/add-goal-dialog/add-goal.component';
import { RemoveDisablePipe } from './remove-disable.pipe';
import { RowColorPipe } from './row-color.pipe';
import { AssumptionsComponent } from './assumptions-view/assumptions-view.component';
import { AddAssumptionDialogComponent } from './dialogues/add-assumption-dialog/add-assumption-dialog.component';
import { DeleteAssumptionComponent } from './dialogues/delete-assumption/delete-assumption.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { NavigationAutomotiveViewComponent } from './navigation-automotive-view/navigation-automotive-view.component';
import { ThreatHistoryComponent } from './dialogues/threat-history/threat-history.component';
import { HelpComponent } from './help/help.component';
import { HelpDetailComponent } from './help/help-detail/help-detail.component';
import { DocumentFilterPipe } from './pipes/document-filter.pipe';
import { MediaPipePipe } from './pipes/media-pipe.pipe';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { WeaknessViewComponent } from './weakness-view/weakness-view.component';
import { WeaknessAnalysisDialog } from './dialogues/weakness-analysis/weakness-analysis-dialog.component';
import { AddWeaknessDialog } from './dialogues/add-weakness-dialog/add-weakness-dialog.component';
import { AnalysisColorPipe } from './analysis-color.pipe';
import { WeaknessLinkVulnerabilityDialog } from './dialogues/weakness-link-vulnerability-dialog/weakness-link-vulnerability-dialog.component';
import { LinkedPipe } from './linked.pipe';
import { VulnerabilityWeaknessLinkDialog } from './dialogues/vulnerability-link-weakness/vulnerability-weakness-link-dialog.component';
import { ControlViewComponent } from './control-view/control-view.component';
import { ShowScrollBarPipe } from './show-scroll-bar.pipe';
import { LoadMilestoneCheckPipe } from './load-milestone-check.pipe';


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    PropertyPanelComponent,
    routingComponents,
    RootViewComponent,
    HomeViewComponent,
    LoadProjectDialog,
    ShowMilestoneDialog,
    DeleteProjectDialog,
    ProjectInfoDialog,
    LoginViewComponent,
    ChangePasswordDialog,
    NotCompatibleBrowserDialog,
    FeatureSettingDialog,
    CreateModuleDialog,
    CreateAssetDialog,
    EditDeleteFeatureDialog,
    AddUpdateVulnerabilityDialog,
    WeaknessAnalysisDialog,
    WeaknessLinkVulnerabilityDialog,
    AddWeaknessDialog,
    VulnerabilityWeaknessLinkDialog,
    RegisterViewComponent,
    AccountAdminComponent,
    MaterialsViewComponent,
    DatabaseViewComponent,
    ConfirmDialogComponent,
    AddGoalDialog,
    AddModifyArrayDialogComponent,
    SingleInputFormDialogComponent,
    DashboardViewComponent,
    EditFeatureDialog,
    SystemConfigurationViewComponent,
    RiskTitlePipe,
    FeasibilityIconPipe,
    FeasibilityRubricsPipe,
    FeasibilityTimePipe,
    FeasibilityTextPipe,
    FeasibilityRatingPipe,
    FeasibilityTotalPipe,
    ObjectsArrayPipe,
    ObjectKeysPipe,
    FeasibilityEnumeratePipe,
    HighLevelThreatRowSpanPipe,
    HighLevelThreatCountPipe,
    HighLevelThreatPipe,
    ThreatRowNumbersPipe,
    ThreatMappingStatusPipe,
    FeatureAssetsPipe,
    AssetsIndeterminatePipe,
    ImpactLevelNamePipe,
    ProtocolsPipe,
    InputChangeDirective,
    PreventDoubleClickDirective,
    Wp29MappingDialogComponent,
    DatabaseSubTypePipe,
    DatabaseSubTypeValuePipe,
    DatabaseSubTypeStatusPipe,
    MitreAttackTacticsPipe,
    MitreAttackDropZonesPipe,
    SelectedTechniquePipe,
    DeleteThreatComponent,
    LoadMilestoneComponent,
    MitreAttackComponent,
    NotificationsDetailsComponent,
    RiskUpdateComponent,
    CheckTodayPipe,
    UnreadRiskNotificationPipe,
    NotificationRiskLevelPipe,
    TacticsThreatsPipe,
    TacticTechniqueComponent,
    CreateBOMComponent,
    CybersecurityGoalSectionComponent,
    CybersecurityGoalDialogComponent,
    CybersecurityGoalComponent,
    ThreatFrameColumnsPipe,
    ResizeThreatNotePipe,
    TextLengthPipe,
    FilterGoalsComponent,
    ModelingResultsComponent,
    ModelingThreatsPipe,
    TextLengthPipe,
    ModelingThreatsTooltipPipe,
    TrimTextPipe,
    NewUserComponent,
    ExpandedFeasibilityHeaderComponent,
    ExpandedImpactHeaderComponent,
    FeasibilityPercentageValuePipe,
    GenerateReportComponent,
    Wp29ThreatMappingComponent,
    ModelModulesPipe,
    AssetsByTypePipe,
    Wp29EighteenpointtwoModulePipe,
    ModuleConnectedCommlinesPipe,
    ModelCommlinesPipe,
    RestoreThreatsComponent,
    ControlBeforeConfirmationComponent,
    ControlAfterConfirmationComponent,
    DisableMergePipe,
    AssetPropertiesComponent,
    AssetPropertyActionPipe,
    ComponentFeatureAssetsPipe,
    NewUserComponent,
    ActiveComponentTypePipe,
    MergeThreatConfirmationComponent,
    VulnerabilitiesComponent,
    DeleteVulnerabilityComponent,
    ActivateSaveButtonPipe,
    FeasibilityRowAppearancePipe,
    WhiteSpaceValidationPipe,
    EditProfileComponent,
    NavigationAutomotiveViewComponent,
    RemoveDisablePipe,
    RowColorPipe,
    AssumptionsComponent,
    AddAssumptionDialogComponent,
    DeleteAssumptionComponent,
    ThreatHistoryComponent,
    HelpComponent,
    HelpDetailComponent,
    DocumentFilterPipe,
    MediaPipePipe,
    WeaknessViewComponent,
    AnalysisColorPipe,
    LinkedPipe,
    ControlViewComponent,
    ShowScrollBarPipe,
    LoadMilestoneCheckPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgmaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    NgxChartsModule,
    NgxDatatableModule,
    NgxSpinnerModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    OverlayModule,
    DragDropModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule
  ],
  entryComponents: [
    LoadProjectDialog,
    ShowMilestoneDialog,
    DeleteProjectDialog,
    ProjectInfoDialog,
    ConfirmDialogComponent,
    ChangePasswordDialog,
    AddModifyArrayDialogComponent,
    SingleInputFormDialogComponent,
    EditFeatureDialog,
    FeatureSettingDialog,
    CreateModuleDialog,
    CreateAssetDialog,
    EditDeleteFeatureDialog,
    AddUpdateVulnerabilityDialog,
    VulnerabilityWeaknessLinkDialog,
    WeaknessAnalysisDialog,
    WeaknessLinkVulnerabilityDialog,
    AddWeaknessDialog,
    AddGoalDialog,
  ],
  providers: [
    ArrOpService,
    DesignSettingsService,
    ComponentVisualChangeService,
    AppHttpService,
    ResultSharingService,
    AuthenticationService,
    ConfirmDialogService,
    AddModifyArrayDialogService,
    Wp29ThreatService,
    SingleInputFormDialogComponent,
    FeasibilityTotalPipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true,
    },
    // { provide: OverlayContainer, useClass: FullscreenOverlayContainer }
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: ErrorHttpInterceptor,
    //   multi: true,
    // },
  ],
  // { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', floatLabel: 'always' } },

  bootstrap: [AppComponent],
  exports: [
    ConfirmDialogComponent,
    AddModifyArrayDialogComponent,
    SingleInputFormDialogComponent,
    RiskUpdateComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
