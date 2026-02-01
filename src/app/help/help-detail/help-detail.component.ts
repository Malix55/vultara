import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-help-detail',
  templateUrl: './help-detail.component.html',
  styleUrls: ['./help-detail.component.css']
})
export class HelpDetailComponent implements OnInit {
  private unsubscribe: Subject<void> = new Subject();
  link: any
  readonly mediaUrl = environment.backendApiUrl + "helpPage";
  readonly relativeUrlHelpPage = "/help";
  currentUrl: string;
  dbData: any;
  awsData: any;
  docId: any;
  constructor(private route: ActivatedRoute, private _router: Router, public _http: HttpClient, private _spinner: NgxSpinnerService,
    private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this._spinner.show("help spinner")
    this.route.params.subscribe(params => {
      this.docId = params['id'];
    });
    this.documentData(this.docId);
    this.s3Images(this.docId);
  }
  // get help images from s3 using document Id
  s3Images(docId: any) {
    let queryParams = new HttpParams().set("id", docId);
    this._http.get(this.mediaUrl, { params: queryParams }).pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.awsData = res
        }
        else {
          this._snackBar.open("Failed to load images", "Failed", {
            duration: 5000,
          })
        }
        this._spinner.hide("help spinner");
      })

  }
  // get document from database
  documentData(docId: any) {
    let queryParams = new HttpParams().set("id", docId);
    this._http.get(this.mediaUrl + "/getData", { params: queryParams }).pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.link = res
          this.dbData = this.link.sort((a, b) => a.position - b.position);
        }
        else {
          this._snackBar.open("Failed to get documents", "Failed", {
            duration: 5000,
          })
        }
        this._spinner.hide("help spinner");
      })

  }

  switchToHelpPage() {
    this._router.navigateByUrl(this.relativeUrlHelpPage);
    this.currentUrl = this.relativeUrlHelpPage;
  }
}