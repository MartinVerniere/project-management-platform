import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentElement } from './comment-element';

describe('CommentElement', () => {
  let component: CommentElement;
  let fixture: ComponentFixture<CommentElement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentElement],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentElement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
