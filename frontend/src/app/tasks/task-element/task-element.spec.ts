import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskElement } from './task-element';

describe('TaskElement', () => {
  let component: TaskElement;
  let fixture: ComponentFixture<TaskElement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskElement],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskElement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
