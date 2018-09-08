import { Injectable, Injector } from '@angular/core';
import {
    SingleContainer,
    KubernetesContainer,
    DockerComposeContainer,
    Container,
    ContainerSettingsInput,
    ContainerSettingsData,
    ImageSourceType,
    DockerHubAccessType,
    ContainerSample,
    ContinuousDeploymentOption } from './container-settings';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { PortalResources } from '../../shared/models/portal-resources';
import { SelectOption } from '../../shared/models/select-option';

@Injectable()
export class ContainerSettingsManager {
    selectedContainer$: Subject<Container> = new Subject<Container>();
    selectedImageSource$: Subject<SelectOption<ImageSourceType>> = new Subject<SelectOption<ImageSourceType>>();
    selectedQuickstartSample$: Subject<ContainerSample> = new Subject<ContainerSample>();
    selectedAcrRegistry$: Subject<string> = new Subject<string>();
    selectedAcrRepo$: Subject<string> = new Subject<string>();
    selectedAcrTag$: Subject<string> = new Subject<string>();
    selectedDockerHubAccessType$: Subject<string> = new Subject<string>();
    selectedContinuousDeploymentOption$: Subject<string> = new Subject<string>();

    containers: Container[] = [];
    containerImageSourceOptions: SelectOption<ImageSourceType>[] = [];
    dockerHubAccessOptions: SelectOption<DockerHubAccessType>[] = [];
    continuousDeploymentOptions: SelectOption<ContinuousDeploymentOption>[] = [];

    constructor(
        private _injector: Injector,
        private _ts: TranslateService) {
    }

    resetSettings(inputs: ContainerSettingsInput<ContainerSettingsData>) {
        this._resetContainers(inputs);
        this._resetImageSourceOptions(inputs);
        this._resetDockerHubAccessOptions(inputs);
        this._resetContinuousDeploymentOptions(inputs);
    }

    initialize(inputs: ContainerSettingsInput<ContainerSettingsData>) {
        this.selectedContainer$.next(this.containers[0]);
        this.selectedImageSource$.next(this.containerImageSourceOptions[0]);
        this.selectedDockerHubAccessType$.next(this.dockerHubAccessOptions[0].value);
    }

    private _resetContainers(inputs: ContainerSettingsInput<ContainerSettingsData>) {
        this.containers = [
            new SingleContainer(this._injector, inputs.data),
            new DockerComposeContainer(this._injector, inputs.data),
            new KubernetesContainer(this._injector, inputs.data),
        ];
    }

    private _resetImageSourceOptions(inputs: ContainerSettingsInput<ContainerSettingsData>) {
        if (inputs.data.fromMenu) {
            this.containerImageSourceOptions = [];
        } else {
            this.containerImageSourceOptions = [{
                displayLabel: this._ts.instant(PortalResources.containerQuickStart),
                value: 'quickstart',
            }];
        }

        this.containerImageSourceOptions.push({
            displayLabel: this._ts.instant(PortalResources.containerACR),
            value: 'azureContainerRegistry',
        });

        this.containerImageSourceOptions.push({
            displayLabel: this._ts.instant(PortalResources.containerDockerHub),
            value: 'dockerHub',
        });

        this.containerImageSourceOptions.push({
            displayLabel: this._ts.instant(PortalResources.containerPrivateRegistry),
            value: 'privateRegistry',
        });
    }

    private _resetDockerHubAccessOptions(inputs: ContainerSettingsInput<ContainerSettingsData>) {
        this.dockerHubAccessOptions = [{
            displayLabel: this._ts.instant(PortalResources.containerRepositoryPublic),
            value: 'public',
        }, {
            displayLabel: this._ts.instant(PortalResources.containerRepositoryPrivate),
            value: 'private',
        }];
    }

    private _resetContinuousDeploymentOptions(inputs: ContainerSettingsInput<ContainerSettingsData>) {
        this.continuousDeploymentOptions = [{
            displayLabel: this._ts.instant(PortalResources.on),
            value: 'on',
        }, {
            displayLabel: this._ts.instant(PortalResources.off),
            value: 'off',
        }];
    }
}