import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-root-view',
  templateUrl: './root-view.component.html',
  styleUrls: ['./root-view.component.css']
})
export class RootViewComponent implements OnInit {

  constructor(private _router: Router) { }

  ngOnInit(): void {
    this._router.navigateByUrl("/dashboard")
  }

}
