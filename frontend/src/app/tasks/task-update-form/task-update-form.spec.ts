import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskUpdateForm } from './task-update-form';

describe('TaskUpdateForm', () => {
  let component: TaskUpdateForm;
  let fixture: ComponentFixture<TaskUpdateForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskUpdateForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskUpdateForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
