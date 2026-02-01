import { Component, Input, OnInit } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'app-notifications-risk-update',
  templateUrl: './risk-update.component.html',
  styleUrls: ['./risk-update.component.css']
})
export class RiskUpdateComponent implements OnInit {
  @Input() matMenu: MatMenu;

  constructor() { }

  ngOnInit(): void { }

}
