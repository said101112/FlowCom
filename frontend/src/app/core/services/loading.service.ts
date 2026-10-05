import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private hideTimeout: any; 
  private loading = new BehaviorSubject<boolean>(false)
  public load$=this.loading.asObservable();
  show(){
    clearTimeout(this.hideTimeout)
    this.loading.next(true);
  }
  hide(){
    this.hideTimeout=setTimeout(()=>{
    this.loading.next(false);
    },1000)
    
  }
  constructor() { }
}
