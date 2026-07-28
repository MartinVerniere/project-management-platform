import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentUpdateForm } from './comment-update-form';

describe('CommentUpdateForm', () => {
  let component: CommentUpdateForm;
  let fixture: ComponentFixture<CommentUpdateForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentUpdateForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentUpdateForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
