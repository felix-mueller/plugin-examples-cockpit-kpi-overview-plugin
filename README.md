# Cockpit KPI Overview Plugin

A Cockpit plugin which shows a grid list of [Failed Jobs][1] on the start page of Cockpit and has three columns: `Job ID`, `Process instance ID` and `Exception`.

![Screenshot](screenshot.png)

## Related Concepts

This plugin is centered around the [Failed Jobs][1] concept and these are the other related concepts which could help us to understand it:

* **[Jobs][2]** are explicit representations of a task to trigger process execution. A job is created whenever a wait state is reached during process execution that has to be triggered internally. This is the case when a timer event or a task marked for asynchronous execution (see [transaction boundaries][5]) is approached.
* **[Job Definitions][2]**: When a process is deployed, the process engine creates a Job Definition for each activity in the process which will create jobs at runtime.
* **[The Job Executor][3]** has two responsibilities: job acquisition and job execution.
* **[Incidents][4]**: Examples of such incidents may be a failed job with elapsed retries (retries = 0), indicating that an execution is stuck and manual administrative action is necessary to repair the process instance.
* **[Failed Jobs][1]**: Unresolved incidents of a process instance or a sub process instance are indicated by Cockpit as failed jobs.


## What's the point?

This plugin basically is a showcase of the capabilities of the Cockpit plugin engine which allows creation of dynamic views with a minimum amount of lines of code. The other point is to show how the Camunda REST API actually works and how handy it is to create a new Cockpit plugin using Camunda UI components which are built upon Angular directives.


## How to register a Cockpit plugin?

Each Cockpit plugin has an Angular Controller, a unique pseudo-URL, such as: `plugin://failed-jobs-plugin/static/app/failed-jobs-table.html` and some other attributes, which are used to register the plugin in a view by a JavaScript Object called `ViewsProvider` and its `registerDefaultView` function in the module configuration.


## Integrate into Camunda webapp

Add the plugin as a dependency to the Cockpit `pom.xml` and rebuild the Camunda web application.

```xml
<dependencies>
  ...
  <dependency>
    <groupId>org.camunda.bpm.cockpit.plugin</groupId>
    <artifactId>cockpit-failed-jobs-plugin</artifactId>
    <version>1.0-SNAPSHOT</version>
  </dependency>
```

## License

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
