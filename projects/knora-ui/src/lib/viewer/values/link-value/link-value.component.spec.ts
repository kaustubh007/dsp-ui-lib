import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import { LinkValueComponent } from './link-value.component';
import {
  ReadLinkValue,
  MockResource,
  UpdateLinkValue,
  CreateLinkValue,
  ReadResource, UpdateTextValueAsString
} from '@knora/api';
import { OnInit, Component, ViewChild, DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {KnoraApiConnectionToken} from '../../../core';
import { By } from '@angular/platform-browser';
import {of} from 'rxjs';

/**
 * Test host component to simulate parent component.
 */
@Component({
  template: `
    <kui-link-value #inputVal [displayValue]="displayInputVal" [mode]="mode" [parentResource]="parentResource"
                    [propIri]="propIri"></kui-link-value>`
})
class TestHostDisplayValueComponent implements OnInit {

  @ViewChild('inputVal', {static: false}) inputValueComponent: LinkValueComponent;

  displayInputVal: ReadLinkValue;
  parentResource: ReadResource;
  propIri: string;
  mode: 'read' | 'update' | 'create' | 'search';

  ngOnInit() {

    MockResource.getTestthing().subscribe(res => {
      const inputVal: ReadLinkValue =
        res[0].getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue', ReadLinkValue)[0];

      this.displayInputVal = inputVal;
      this.propIri = this.displayInputVal.property;
      this.parentResource = res[0];
      this.mode = 'read';
    });

  }
}

/**
 * Test host component to simulate parent component.
 */
@Component({
  template: `
    <kui-link-value #inputVal [mode]="mode" [parentResource]="parentResource" [propIri]="propIri"></kui-link-value>`
})
class TestHostCreateValueComponent implements OnInit {

  @ViewChild('inputVal', {static: false}) inputValueComponent: LinkValueComponent;
  parentResource: ReadResource;
  propIri: string;
  mode: 'read' | 'update' | 'create' | 'search';

  ngOnInit() {

    MockResource.getTestthing().subscribe(res => {
      this.propIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue';
      this.parentResource = res[0];
      this.mode = 'create';
    });
  }
}

describe('LinkValueComponent', () => {

  beforeEach(async(() => {
    const valuesSpyObj = {
      v2: {
        search: jasmine.createSpyObj('search', ['doSearchByLabel']),
      }
    };
    TestBed.configureTestingModule({
      declarations: [
        LinkValueComponent,
        TestHostDisplayValueComponent,
        TestHostCreateValueComponent
       ],
       imports: [
        ReactiveFormsModule,
        MatInputModule,
        MatAutocompleteModule,
        BrowserAnimationsModule
      ],
      providers: [
        {
          provide: KnoraApiConnectionToken,
          useValue: valuesSpyObj
        }
      ]
    })
    .compileComponents();
  }));

  describe('display and edit a link value', () => {
    let testHostComponent: TestHostDisplayValueComponent;
    let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
    let valueComponentDe: DebugElement;
    let valueInputDebugElement: DebugElement;
    let valueInputNativeElement;
    let commentInputDebugElement: DebugElement;
    let commentInputNativeElement;

    beforeEach(() => {
      testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();

      const hostCompDe = testHostFixture.debugElement;

      valueComponentDe = hostCompDe.query(By.directive(LinkValueComponent));
      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

    });

    it('should display an existing value', fakeAsync(() => {

      expect(testHostComponent.inputValueComponent.displayValue.linkedResourceIri).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');
      expect(testHostComponent.inputValueComponent.displayValue.linkedResource.label).toEqual('Sierra');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      expect(testHostComponent.inputValueComponent.mode).toEqual('read');

      expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBe(true);
      expect(testHostComponent.inputValueComponent.valueFormControl.value.label).toEqual('Sierra');

      // setValue has to be called, otherwise the native input field does not get the label via the displayWith function
      const res = testHostComponent.inputValueComponent.valueFormControl.value;
      testHostComponent.inputValueComponent.valueFormControl.setValue(res);

      // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('Sierra');
      expect(valueInputNativeElement.readOnly).toEqual(true);
    }));

    it('should make a link value editable', fakeAsync(() => {

      testHostComponent.mode = 'update';
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');
      expect(valueInputNativeElement.readOnly).toEqual(false);
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const update = new ReadResource();
      update.id = 'newId';
      update.label = 'new target';

      testHostComponent.inputValueComponent.valueFormControl.setValue(update);

      // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('new target');
      expect(valueInputNativeElement.readOnly).toEqual(false);

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue instanceof UpdateLinkValue).toBeTruthy();

      expect((updatedValue as UpdateLinkValue).linkedResourceIri).toEqual('newId');

    }));

    it('should search for resources by their label', () => {

      const valuesSpy = TestBed.get(KnoraApiConnectionToken);
      valuesSpy.v2.search.doSearchByLabel.and.callFake(
        () => {
          const res = new ReadResource();
          res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
          res.label = 'hidden thing';
          return of([res]);
        }
      );

      // simulate user searching for label 'thing'
      testHostComponent.inputValueComponent.valueFormControl.setValue('thing');

      expect(valuesSpy.v2.search.doSearchByLabel).toHaveBeenCalledWith('thing', 0, { limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'});
      expect(testHostComponent.inputValueComponent.resources.length).toEqual(1);
      expect(testHostComponent.inputValueComponent.resources[0].id).toEqual('http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ');
    });

    it('should not return an invalid update value (string)', () => {

      const valuesSpy = TestBed.get(KnoraApiConnectionToken);

      valuesSpy.v2.search.doSearchByLabel.and.callFake(
        () => {
          const res = new ReadResource();
          res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
          res.label = 'hidden thing';
          return of([res]);
        }
      );

      testHostComponent.mode = 'update';
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');
      expect(valueInputNativeElement.readOnly).toEqual(false);
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      testHostComponent.inputValueComponent.valueFormControl.setValue('my string');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue).toBeFalsy();

    });

    it('should not return an invalid update value (no value)', () => {

      const valuesSpy = TestBed.get(KnoraApiConnectionToken);

      valuesSpy.v2.search.doSearchByLabel.and.callFake(
        () => {
          const res = new ReadResource();
          res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
          res.label = 'hidden thing';
          return of([res]);
        }
      );

      testHostComponent.mode = 'update';
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');
      expect(valueInputNativeElement.readOnly).toEqual(false);
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      testHostComponent.inputValueComponent.valueFormControl.setValue(null);

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue).toBeFalsy();

    });

    it('should validate an existing value with an added comment', () => {

      testHostComponent.mode = 'update';
      testHostFixture.detectChanges();

      commentInputDebugElement = valueComponentDe.query(By.css('textarea.comment'));
      commentInputNativeElement = commentInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');
      expect(valueInputNativeElement.readOnly).toEqual(false);
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      commentInputNativeElement.value = 'this is a comment';
      commentInputNativeElement.dispatchEvent(new Event('input'));
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();
      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();
      expect(updatedValue instanceof UpdateLinkValue).toBeTruthy();
      expect((updatedValue as UpdateLinkValue).valueHasComment).toEqual('this is a comment');

    });

    it('should restore the initially displayed value', fakeAsync(() => {

      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');

      expect(valueInputNativeElement.readOnly).toEqual(false);

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      // simulate user input
      const update = new ReadResource();
      update.id = 'newId';
      update.label = 'new target';

      testHostComponent.inputValueComponent.valueFormControl.setValue(update);

      // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('new target');
      expect(valueInputNativeElement.readOnly).toEqual(false);

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      testHostComponent.inputValueComponent.resetFormControl();

      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('Sierra');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

    }));

    it('should set a new display value', fakeAsync(() => {

      // setValue has to be called, otherwise the native input field does not get the label via the displayWith function
      const res = testHostComponent.inputValueComponent.valueFormControl.value;
      testHostComponent.inputValueComponent.valueFormControl.setValue(res);

      // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('Sierra');

      const linkedRes = new ReadResource();
      linkedRes.id = 'newId';
      linkedRes.label = 'new target';

      const newLink = new ReadLinkValue();
      newLink.id = 'updatedId';
      newLink.linkedResourceIri = 'newId';
      newLink.linkedResource = linkedRes;

      testHostComponent.displayInputVal = newLink;

      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('new target');

    }));

  });

  describe('create a new link value', () => {
    let testHostComponent: TestHostCreateValueComponent;
    let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;

    let valueComponentDe: DebugElement;

    let valueInputDebugElement: DebugElement;
    let valueInputNativeElement;
    let commentInputDebugElement: DebugElement;
    let commentInputNativeElement;

    beforeEach(() => {

      testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();

      const hostCompDe = testHostFixture.debugElement;

      valueComponentDe = hostCompDe.query(By.directive(LinkValueComponent));

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      commentInputDebugElement = valueComponentDe.query(By.css('textarea.comment'));
      commentInputNativeElement = commentInputDebugElement.nativeElement;
    });

    it('should search a new value', () => {
      const valuesSpy = TestBed.get(KnoraApiConnectionToken);

      valuesSpy.v2.search.doSearchByLabel.and.callFake(
        () => {
          const res = new ReadResource();
          res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
          res.label = 'hidden thing';
          return of([res]);
        }
      );

      testHostComponent.inputValueComponent.searchByLabel('thing');
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('create');
      expect(valuesSpy.v2.search.doSearchByLabel).toHaveBeenCalledWith('thing', 0, {limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'});
      expect(testHostComponent.inputValueComponent.resources.length).toEqual(1);
    });

    it('should create a value', () => {

      // simulate user input
      const res = new ReadResource();
      res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
      res.label = 'hidden thing';

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      testHostComponent.inputValueComponent.valueFormControl.setValue(res);

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBeTruthy();

      const newValue = testHostComponent.inputValueComponent.getNewValue();
      expect(newValue instanceof CreateLinkValue).toBeTruthy();
      expect((newValue as CreateLinkValue).linkedResourceIri).toEqual('http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ');
    });

    it('should only create a new value if input is a resource', () => {
      // simulate user input
      const valuesSpy = TestBed.get(KnoraApiConnectionToken);

      valuesSpy.v2.search.doSearchByLabel.and.callFake(
        () => {
          const res = new ReadResource();
          res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
          res.label = 'hidden thing';
          return of([res]);
        }
      );
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const label = 'thing';
      testHostComponent.inputValueComponent.valueFormControl.setValue(label);

      expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBeFalsy();
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const newValue = testHostComponent.inputValueComponent.getNewValue();

      expect(newValue instanceof CreateLinkValue).toBeFalsy();
    });

    it('should reset form after cancellation', fakeAsync(() => {

      // simulate user input
      const res = new ReadResource();
      res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
      res.label = 'hidden thing';
      testHostComponent.inputValueComponent.valueFormControl.setValue(res);

      // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(valueInputNativeElement.value).toEqual('hidden thing');

      commentInputNativeElement.value = 'created comment';

      commentInputNativeElement.dispatchEvent(new Event('input'));

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('create');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      testHostComponent.inputValueComponent.resetFormControl();

      testHostFixture.detectChanges();
      tick();
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(testHostComponent.inputValueComponent.valueFormControl.value).toEqual(null);

      expect(valueInputNativeElement.value).toEqual('');
      expect(commentInputNativeElement.value).toEqual('');

    }));
  });
});