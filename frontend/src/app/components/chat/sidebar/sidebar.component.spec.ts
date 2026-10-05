import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ne charge aucun profil sans identifiant en session', () => {
    const spy = spyOn(component['api'], 'getUserProfile');
    spy.and.callThrough();

    component.ngOnInit();

    expect(spy).not.toHaveBeenCalled();
  });

  it('signale l ajout d un ami au parent', () => {
    const emitSpy = spyOn(component.isAdduserChange, 'emit');

    component.toggle();

    expect(component.isAdduser).toBeTrue();
    expect(emitSpy).toHaveBeenCalledWith(true);
  });
});
