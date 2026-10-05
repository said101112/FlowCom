import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BorderAnimComponent } from './border-anim.component';

describe('BorderAnimComponent', () => {
  let component: BorderAnimComponent;
  let fixture: ComponentFixture<BorderAnimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BorderAnimComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BorderAnimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
