import { Component, Input, OnDestroy, Injector } from '@angular/core';
import { ACRRegistry, ContainerImageSourceData } from '../../container-settings';
import { DropDownElement } from '../../../../shared/models/drop-down-element';
import { ContainerACRService } from '../../services/container-acr.service';
import { FormGroup } from '@angular/forms';
import { FeatureComponent } from '../../../../shared/components/feature-component';
import { Observable } from 'rxjs/Observable';
import { ContainerMultiConfigService } from '../../services/container-multiconfig.service';

@Component({
  selector: 'container-image-source-acr',
  templateUrl: './container-image-source-acr.component.html',
  styleUrls: [
    './../../container-settings.component.scss',
    './../container-image-source.component.scss',
    './container-image-source-acr.component.scss',
  ],
})
export class ContainerImageSourceACRComponent extends FeatureComponent<ContainerImageSourceData> implements OnDestroy {
  @Input()
  set containerImageSourceInfoInput(containerImageSourceInfo: ContainerImageSourceData) {
    this.setInput(containerImageSourceInfo);
  }

  public loadingRegistries: boolean;
  public loadingRepo: boolean;
  public loadingTag: boolean;
  public registriesMissing: boolean;
  public registryDropdownItems: DropDownElement<string>[];
  public registryItems: ACRRegistry[];
  public repositoryDropdownItems: DropDownElement<string>[];
  public repositoryItems: string[];
  public tagDropdownItems: DropDownElement<string>[];
  public tagItems: string[];
  public containerImageSourceInfo: ContainerImageSourceData;
  public selectedRegistry: string;
  public selectedRepository: string;
  public selectedTag: string;
  public imageSourceForm: FormGroup;

  constructor(private _acrService: ContainerACRService, private _multiConfigService: ContainerMultiConfigService, injector: Injector) {
    super('ContainerImageSourceACRComponent', injector, 'dashboard');
    this.featureName = 'ContainerSettings';
  }

  protected setup(inputEvents: Observable<ContainerImageSourceData>) {
    return inputEvents
      .distinctUntilChanged()
      .switchMap(containerImageSourceInfo => {
        this.containerImageSourceInfo = containerImageSourceInfo;
        this.imageSourceForm = containerImageSourceInfo.imageSourceForm;
        this._reset();
        this.loadingRegistries = true;
        this.selectedRegistry = this.imageSourceForm.controls.registry.value;
        this.selectedRepository = this.imageSourceForm.controls.repository ? this.imageSourceForm.controls.repository.value : '';
        this.selectedTag = this.imageSourceForm.controls.tag ? this.imageSourceForm.controls.tag.value : '';

        return this._acrService.getRegistries(this.containerImageSourceInfo.subscriptionId);
      })
      .do(registryResources => {
        if (registryResources.isSuccessful && registryResources.result.value && registryResources.result.value.length > 0) {
          this.registryItems = registryResources.result.value.map(registryResource => ({
            ...registryResource.properties,
            resourceId: registryResource.id,
          }));

          this.registryDropdownItems = registryResources.result.value.map(registryResource => ({
            displayLabel: registryResource.name,
            value: registryResource.properties.loginServer,
          }));

          this.loadingRegistries = false;
          this.registriesMissing = false;

          if (this.selectedRegistry) {
            this._loadRepositories();
          }
        } else {
          this.registriesMissing = true;
        }
      });
  }

  public registryChanged(element: DropDownElement<string>) {
    this.selectedRepository = '';
    this.repositoryDropdownItems = [];
    this.selectedTag = '';
    this.tagDropdownItems = [];
    this.loadingRepo = true;

    const acrRegistry = this.registryItems.find(item => item.loginServer === element.value);

    this._acrService.getCredentials(acrRegistry.resourceId).subscribe(credential => {
      if (credential.isSuccessful) {
        const username = credential.result.username;
        const password = credential.result.passwords[0].value;

        if (username && password) {
          this.imageSourceForm.controls.login.setValue(username);
          this.imageSourceForm.controls.password.setValue(password);
          this._loadRepositories();
        }
      }
    });
  }

  public respositoryChanged(element: DropDownElement<string>) {
    this.selectedTag = '';
    this.tagDropdownItems = [];
    this._loadTags();
  }

  public extractConfig(event) {
    this._multiConfigService
      .extractConfig(event.target)
      .first()
      .subscribe(config => {
        this.imageSourceForm.controls.config.setValue(config);
      });
  }

  private _reset() {
    this.loadingRegistries = false;
    this.loadingRepo = false;
    this.loadingTag = false;
    this.registriesMissing = false;
  }

  private _loadRepositories() {
    this.loadingRepo = true;
    this._acrService
      .getRepositories(
        this.containerImageSourceInfo.subscriptionId,
        this.containerImageSourceInfo.resourceId,
        this.selectedRegistry,
        this.imageSourceForm.controls.login.value,
        this.imageSourceForm.controls.password.value
      )
      .subscribe(response => {
        if (response.isSuccessful && response.result && response.result.repositories && response.result.repositories.length > 0) {
          this.repositoryItems = response.result.repositories.sort();

          this.repositoryDropdownItems = this.repositoryItems.map(item => ({
            displayLabel: item,
            value: item,
          }));

          if (this.selectedRepository) {
            this._loadTags();
          }
        }

        this.loadingRepo = false;
      });
  }

  private _loadTags() {
    this.loadingTag = true;
    this._acrService
      .getTags(
        this.containerImageSourceInfo.subscriptionId,
        this.containerImageSourceInfo.resourceId,
        this.selectedRegistry,
        this.selectedRepository,
        this.imageSourceForm.controls.login.value,
        this.imageSourceForm.controls.password.value
      )
      .subscribe(response => {
        if (response.isSuccessful && response.result && response.result.tags && response.result.tags.length > 0) {
          this.tagItems = response.result.tags.sort();

          this.tagDropdownItems = this.tagItems.map(item => ({
            displayLabel: item,
            value: item,
          }));
        }

        this.loadingTag = false;
      });
  }
}
