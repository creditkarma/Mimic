---
title: Getting Started
permalink: /getting_started/
layout: page
categories:
  - beginner
  - tutorial
  - graphql
excerpt: How to install and use Mimic
---
Mimic is released as a [Desktop](https://github.com/creditkarma/Mimic/releases/latest) application, [CLI(headless)](https://www.npmjs.com/package/@creditkarma/mimic-cli) tool and a set of [NPM](https://www.npmjs.com/search?q=@creditkarma/mimic) libraries.
{:.notification.is-info}
## Desktop
1. At first [Download](https://github.com/creditkarma/Mimic/releases/latest){:#download.button.is-primary} or [Other Platforms](https://github.com/creditkarma/Mimic/releases/latest) if you haven't already.

2. Download an example graphQL schema [tweets.graphql]({{ site.baseurl }}/_pages/tweets.graphql):

```graphql
{% include_relative tweets.graphql %}
```
<details>
  <summary>3. Create a new service with downloaded schema:</summary>
  <ol>
    <li>Navigate in menu: File > New Service</li>
    <li>Click on "GraphQL" option</li>
    <li>Click "Choose File" button and select recently downloaded "tweets.graphql" file</li>
    <li>Give your service a name (for example "Tweets")</li>
    <li>Assign your service a port (for example 8080)</li>
  </ol>
</details><br/>
![new service]({{ site.baseurl }}/assets/images/step1.gif){:.image.is-850}

<details>
  <summary>4. Enable your service and add response:</summary>
  <ol>
    <li>Navigate to service details page by click on your service name on the left panel</li>
    <li>Enable your service by clicking on the service toggle on the left panel by your service name</li>
    <li>Click "Add" button on the service details page</li>
    <li>Choose "query" schema</li>
    <li>Switch editor to a "TREE" mode by clicking on the toggle by the "Data" field</li>
    <li>Left-click on any node to see all available options and set desired response values</li>
    <li>Click on the "Save" button and Mimic will immediately apply changes to the server</li>
  </ol>
</details><br/>
![add response]({{ site.baseurl }}/assets/images/step2.gif){:.image.is-850}

Now you can query Mimic with [GraphiQL](https://electronjs.org/apps/graphiql) tool:

![GraphiQL]({{ site.baseurl }}/assets/images/step3.gif){:.image.is-850}

Congratulations! I've completed Mimic Desktop tutorial.

## CLI (Headless)

To install a CLI version, run:

    npm install -g @creditkarma/mimic-cli

<details>
  <summary>CLI version works with exported service definition:</summary>
  <ol>
    <li>Navigate in menu: File > Export Services...</li>
    <li>Select services you would like to export</li>
    <li>Click "Export" button</li>
    <li>Choose location and filename for exported services (for example "exported.mimic")</li>
  </ol>
</details><br/>
![export]({{ site.baseurl }}/assets/images/export.gif)

Run CLI with services you just exported:

    $ mimic exported.mimic

![mimic cli]({{ site.baseurl }}/assets/images/cli.gif)
