import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  readonly relativeUrlHelpPage = "/helpdetail";
  readonly mediaUrl = environment.backendApiUrl + "helpPage";
  private unsubscribe: Subject<void> = new Subject();
  versionNumber: String = environment.version;
  helpMenuBtnDisabled: boolean = true;
  currentUrl: string;
  panelOpenState = false;
  docId: any;
  videoUrl: any;
  documents: any = [];
  videos: any = []
  helpData: any;
  search: string = '';
  documentCopy: any = [];

  constructor(private _router: Router, public _http: HttpClient, public _snackBar: MatSnackBar, private _spinner: NgxSpinnerService) {}
  async ngOnInit() {
    this._spinner.show("help spinner")
    this.currentUrl = localStorage.getItem("intendedUrl");
    this.helpTabsData();
    this._spinner.hide("help spinner")
  }
  // help document tabs
  helpTabsData() {
    this._http.get<any>(this.mediaUrl + "/getTabs").pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.helpData = res.length;
          (res.map(((item) => {
            if (item.records[0].helpDocumentType == "document") {
              this.documents.push(item.records);
              this.documentCopy.push(item.records);
            } else {
              this.videos.push(item.records);
              this.documentCopy.push(item.records);
            }
          })))
        }
        else {
          this._snackBar.open("Failed to get document data", "Failed", {
            duration: 5000,
          })
        }
      })
  }
  // get video on click
  getVideo() {
    for (let value of this.videos) {
      const val = value;
      const vidId = val.find(item => item.displayType === 'video')
      let queryParams = new HttpParams().set("id", vidId.videoId);
      this._http.get<any>(this.mediaUrl + "/getVideo", { params: queryParams }).pipe(takeUntil(this.unsubscribe)).subscribe((res) => {
      if (res) {
      this.videoUrl = res;
      }
      else {
      let videoPlayer = <HTMLVideoElement>document.getElementById('demoVideo');
      videoPlayer.pause();
        }
      });
    }
  }
  searchFn() {
    this.documents = this.documentCopy.filter((doc) => {
      return doc[0].text?doc[0].text.toLowerCase().includes(this.search):false
    })
    this.videos = this.documentCopy.filter((doc) => {
      if (doc[0].helpDocumentType == 'video') {
        return doc[0].text ? doc[0].text.toLowerCase().includes(this.search) : true
      }
      else {
        return false;
      }
    })
  }
  // see more on detail page
  switchToDetailPage() {
    this._router.navigateByUrl(this.relativeUrlHelpPage);
    this.currentUrl = this.relativeUrlHelpPage;
  }

}