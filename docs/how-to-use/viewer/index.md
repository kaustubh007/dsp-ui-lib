# DSP-UI VIEWER module

DspViewerModule contains components to display resources; as a single item or as a list for search results. It is comprised of resource sub-components such as file representations components to display still images, video, audio or text only and also value components to use single property elements.

## Prerequisites

For help getting started with a new Angular app, check out the [Angular CLI](https://cli.angular.io/).

For existing apps, follow these steps to begin using DSP-UI VIEWER.

## Installation

DspViewerModule is part of @dasch-swiss/dsp-ui, follow [the installation guide](/how-to-use/getting-started/).

## Setup

Import the viewer module in your app.module.ts and add it to the NgModules's imports:

```javascript
import { AppComponent } from './app.component';
import { DspCoreModule, DspViewerModule } from '@dasch-swiss/dsp-ui';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        DspCoreModule, // <- core module is required for some components and directives
        DspViewerModule // <- add viewer module in the imports
    ],
    providers:  [ ... ]    // <-- add providers as mentioned in the installation guide
    bootstrap: [AppComponent]
})
export class AppModule {
}
```

## Usage

<!-- example of resource viewer -->
Use DSP-UI VIEWER module in the component template as follows. The example shows how to display a resource by iri = 'http://rdfh.ch/0803/18a671b8a601'.

```html
<dsp-resource-view [iri]="'http://rdfh.ch/0803/18a671b8a601'"></dsp-resource-view>
```
