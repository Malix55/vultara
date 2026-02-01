import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


const NgMaterialComponents = [
  MatButtonModule,
  MatToolbarModule,
  MatSidenavModule,
  MatTabsModule,
  MatSelectModule,
  MatFormFieldModule,
  MatChipsModule,
  MatIconModule,
  MatCardModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDividerModule,
  MatMenuModule,
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,
  MatInputModule,
  MatGridListModule,
  MatAutocompleteModule,
  MatDialogModule,
  MatListModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatButtonToggleModule,
  MatProgressSpinnerModule,
  MatBadgeModule,
  MatProgressBarModule,
  MatSlideToggleModule
];

@NgModule({
  imports: [NgMaterialComponents],
  exports: [NgMaterialComponents],
})
export class NgmaterialModule { }

