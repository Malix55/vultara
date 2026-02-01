import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-asset-properties',
  templateUrl: './asset-properties.component.html',
  styleUrls: ['./asset-properties.component.css']
})
export class AssetPropertiesComponent implements OnInit, OnDestroy {
  readonly assetRootUrl = environment.backendApiUrl + "assets";
  readonly featureRootUrl = environment.backendApiUrl + "features";

  private assetFeatureLastIndex: number;
  private assetFeatureIndex: number;
  private unsubscribe: Subject<void> = new Subject<void>();

  public loadingAsset: boolean = true;
  public assetDetails: any;
  public feature: any;
  public selectedFeature: string = "";

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<AssetPropertiesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    if (this.data.module && this.data.module.assetId) {
      const assetIndex: number = this.data.module.assetId.findIndex((_: string) => _ === this.data.assetId);
      if (assetIndex > -1) {
        const assetFeatureIndex = this.data.module.assetFeatureIndex[assetIndex];
        if (assetFeatureIndex >= 0) {
          if (!this.data.editable) {
            this.feature = this.data.module.feature[assetFeatureIndex];
          }
        }
      }
      this.getAssetInformation(this.data.assetId);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Feature change event - get selected feature index and last index of the feature to place an asset.
  public selectAssetFeature($event: any) {
    this.selectedFeature = $event.value;
    this.assetFeatureIndex = this.data.module.feature.findIndex((_: any) => _ === this.selectedFeature);
    this.assetFeatureLastIndex = this.data.module.assetFeatureIndex.lastIndexOf(this.assetFeatureIndex);
  }

  // Get asset information from given asset id
  private getAssetInformation(assetId: string) {
    this.loadingAsset = true;
    this.http
      .get(
        this.assetRootUrl +
        `/asset?assetId=${assetId}`
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: any) => {
          this.loadingAsset = false;
          if (res) {
            this.assetDetails = res;
          }
        });
  }

  // After confirm button click - close dialog if not editable otherwise get related asset and feature information then close dialog.
  public confirmAssetProperties() {
    if (!this.data.editable) {
      this.dialogRef.close();
    } else {
      const asset: any = {
        _id: this.assetDetails._id,
        name: this.assetDetails.name,
        assetType: this.assetDetails.assetType,
        subType: this.assetDetails.subType
      };

      this.dialogRef.close({
        asset,
        assetFeatureIndex: this.assetFeatureIndex,
        assetFeatureLastIndex: this.assetFeatureLastIndex
      });
    }
  }

}
