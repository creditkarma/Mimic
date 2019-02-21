Mimic is released as a [Desktop](https://github.com/creditkarma/Mimic/releases/latest) application, [CLI(headless)](https://www.npmjs.com/package/@creditkarma/mimic-cli) tool and a set of [NPM](https://www.npmjs.com/search?q=@creditkarma/mimic) libraries.
{:.notification.is-info}

1.  At first [Download](https://github.com/creditkarma/Mimic/releases/latest){:#download.button.is-primary} or [Other Platforms](https://github.com/creditkarma/Mimic/releases/latest) if you haven't already.

2.  Download an example graphQL schema [tweets.graphql]({{ site.baseurl }}/assets/tweets.graphql):

    ```graphql
    type User {
      id: ID!
      first_name: String
      last_name: String
      full_name: String
    }

    type Notification {
      id: ID!
    }

    type Meta {
      id: ID!
    }

    type Tweet {
      id: ID!
      title: String
      Author: User
    }

    type Query {
      Tweet(id: ID!): Tweet 
      Tweets(limit: Int, skip: Int, sort_field: String, sort_order: String): [Tweet]
      TweetsData: Meta
      User(id: ID!): User
      Notifications(limit: Int): [Notification]
      NotificationsMeta: Meta
    }
    ```
<br/>

3.  Create a new service with downloaded schema:
  * Navigate in menu: File > New Service
  * Click on "GraphQL" option
  * Click "Choose File" button and select recently downloaded "tweets.graphql" file
  * Give your service a name (for example "Tweets")
  * Assign your service a port (for example 8080)

    ![add service]({{ site.baseurl }}/assets/images/step1.gif){:.image.is-880.playable}
<br/><br/>

4.  Enable your service and add response:
  * Navigate to service details page by click on your service name on the left panel
  * Enable your service by clicking on the service toggle on the left panel by your service name
  * Click "Add" button on the service details page
  * Choose "query" schema
  * Switch editor to a "TREE" mode by clicking on the toggle by the "Data" field
  * Left-click on any node to see all available options and set desired response values
  * Click on the "Save" button and Mimic will immediately apply changes to the server

    ![add response]({{ site.baseurl }}/assets/images/step2.gif){:.image.is-880.playable}
<br/><br/>

5.  Now you can query Mimic with [GraphiQL](https://electronjs.org/apps/graphiql) tool:

    ![GraphiQL]({{ site.baseurl }}/assets/images/step3.gif){:.image.is-880.playable}
<br/>
#### Congratulations! You've completed Mimic Desktop tutorial.
