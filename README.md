# Cockpit KPI Overview Plugin

## ToDos

- Filtering on time frames
- Send reminder emails

## What's the point?
With the help of this Cockpit Plugin one can display KPIs that were defined within the BPMN model using the KPI Element Template provided within this repository. 
This plugin provides two views that integrate into two extension points:
###Process Definition History Tab

###Process Instance History Tab

## How to register a Cockpit plugin?

> ###Development purposes###
For development purposes it is best to run the cockpit plugin inside a standalone Camunda EE.
This is already set up and one can go ahead by using Maven  mvn jetty:run -P develop

----------

> ###Production purposes###
For production purposes it is best to package the cockpit plugin using mvn package and then copy it to Camunda WebApp Lib folder.

## License

Use under terms of the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)