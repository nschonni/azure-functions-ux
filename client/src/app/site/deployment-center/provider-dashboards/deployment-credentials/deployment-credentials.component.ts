import { Component, OnInit, Input, Injector, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CacheService } from '../../../../shared/services/cache.service';
import { PublishingProfile } from '../../Models/publishing-profile';
import { from } from 'rxjs/observable/from';
import { Subject } from 'rxjs/Subject';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BroadcastService } from '../../../../shared/services/broadcast.service';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { RequiredValidator } from '../../../../shared/validators/requiredValidator';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmPasswordValidator } from '../../../../shared/validators/passwordValidator';
import { FeatureComponent } from '../../../../shared/components/feature-component';
import { Observable } from 'rxjs/Observable';
import { SiteService } from '../../../../shared/services/site.service';
import { KeyCodes } from '../../../../shared/models/constants';
import { Dom } from '../../../../shared/Utilities/dom';

@Component({
  selector: 'app-deployment-credentials',
  templateUrl: './deployment-credentials.component.html',
  styleUrls: ['./deployment-credentials.component.scss', '../../deployment-center-setup/deployment-center-setup.component.scss'],
})
export class DeploymentCredentialsComponent extends FeatureComponent<string> implements OnInit, OnDestroy {
  @ViewChild('credsTabs')
  groupElements: ElementRef;

  @Input()
  resourceId: string;
  @Input()
  standalone = true;

  activeTab: 'user' | 'app' = 'app';

  public appUserName: string;
  public appPwd: string;

  public userPasswordForm: FormGroup;
  private _resetPublishingProfile$ = new Subject();
  private _saveUserCredentials$ = new Subject();

  private _ngUnsubscribe$ = new Subject();
  private _currentTabIndex: number;
  public saving = false;
  public resetting = false;
  constructor(
    private _cacheService: CacheService,
    private _siteService: SiteService,
    fb: FormBuilder,
    broadcastService: BroadcastService,
    translateService: TranslateService,
    injector: Injector
  ) {
    super('DeploymentCredentialsComponent', injector);
    const requiredValidation = new RequiredValidator(translateService, true);
    this.userPasswordForm = fb.group({
      userName: ['', [requiredValidation]],
      password: ['', [requiredValidation]],
      passwordConfirm: [''],
    });
    this.userPasswordForm
      .get('passwordConfirm')
      .setValidators(ConfirmPasswordValidator.create(translateService, this.userPasswordForm.get('password')));
  }

  protected setup(inputEvents: Observable<string>) {
    return inputEvents.switchMap(() => {
      const publishXml$ = this._siteService
        .getPublishingProfile(this.resourceId)
        .switchMap(r => from(PublishingProfile.parsePublishProfileXml(r.result)))
        .filter(x => x.publishMethod === 'FTP')
        .do(ftpProfile => {
          this.appUserName = ftpProfile.userName;
          this.appPwd = ftpProfile.userPWD;
        });

      const publishingUsers$ = this._cacheService.getArm(`/providers/Microsoft.Web/publishingUsers/web`, true).do(r => {
        const creds = r.json();
        this.userPasswordForm.reset({ userName: creds.properties.publishingUserName, password: '', passwordConfirm: '' });
      });
      return forkJoin(publishXml$, publishingUsers$);
    });
  }

  ngOnInit() {
    this._resetPublishingProfile$
      .takeUntil(this._ngUnsubscribe$)
      .do(() => (this.resetting = true))
      .switchMap(() => {
        return this._cacheService.postArm(`${this.resourceId}/newpassword`, true);
      })
      .do(() => (this.resetting = false))
      .subscribe(() => this.setInput(this.resourceId));

    this._saveUserCredentials$
      .takeUntil(this._ngUnsubscribe$)
      .do(() => (this.saving = true))
      .switchMap(() =>
        this._cacheService.putArm(`/providers/Microsoft.Web/publishingUsers/web`, null, {
          properties: {
            publishingUserName: this.userPasswordForm.value.userName,
            publishingPassword: this.userPasswordForm.value.password,
          },
        })
      )
      .do(() => (this.saving = false))
      .subscribe(() => this.setInput(this.resourceId));
    this.setInput(this.resourceId);
  }

  ngOnDestroy() {
    this._ngUnsubscribe$.next();
    super.ngOnDestroy();
  }
  selectTab(tab) {
    this.activeTab = tab;
    this._currentTabIndex = 'app' ? 0 : 1;
  }
  _getTabElements() {
    return this.groupElements.nativeElement.children;
  }

  _clearFocusOnTab(elements: HTMLCollection, index: number) {
    const oldFeature = Dom.getTabbableControl(<HTMLElement>elements[index]);
    Dom.clearFocus(oldFeature);
  }

  _setFocusOnTab(elements: HTMLCollection, index: number) {
    let finalIndex = -1;
    let destFeature: Element;

    // Wrap around logic for navigating through a tab list
    if (elements.length > 0) {
      if (index > 0 && index < elements.length) {
        finalIndex = index;
      } else if (index === -1) {
        finalIndex = elements.length - 1;
      } else {
        finalIndex = 0;
      }
      destFeature = elements[finalIndex];
    }

    this._currentTabIndex = finalIndex;

    if (destFeature) {
      const newFeature = Dom.getTabbableControl(<HTMLElement>destFeature);
      Dom.setFocus(<HTMLElement>newFeature);
    }
  }

  onKeyPress(event: KeyboardEvent, info: 'app' | 'user') {
    if (event.keyCode === KeyCodes.enter || event.keyCode === KeyCodes.space) {
      this.selectTab(info);
      event.preventDefault();
    } else if (event.keyCode === KeyCodes.arrowRight) {
      const tabElements = this._getTabElements();
      this._clearFocusOnTab(tabElements, this._currentTabIndex);
      this._setFocusOnTab(tabElements, this._currentTabIndex + 1);
      event.preventDefault();
    } else if (event.keyCode === KeyCodes.arrowLeft) {
      const tabElements = this._getTabElements();
      this._clearFocusOnTab(tabElements, this._currentTabIndex);
      this._setFocusOnTab(tabElements, this._currentTabIndex - 1);
      event.preventDefault();
    }
  }
  public resetPublishingProfile = () => this._resetPublishingProfile$.next();
  public saveUserCredentails = () => this._saveUserCredentials$.next();
}
