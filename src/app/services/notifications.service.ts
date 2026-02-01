import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readNotificationSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  readNotification$ = this.readNotificationSubject.asObservable();

  constructor() { }

  // Remove a notification 
  public readNotificationById(data?: any) {
    this.readNotificationSubject.next(data);
  }
}
