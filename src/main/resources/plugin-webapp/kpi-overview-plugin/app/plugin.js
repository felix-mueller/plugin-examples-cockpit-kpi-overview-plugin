var CONST_BPMN_TYPES = {
    'userTask': 'bpmn:UserTask'
};
var CONST_REST_URLS = {
    'task': 'engine://engine/:engine/task/',
    'historyTask': 'engine://engine/:engine/history/task/'
};
/*global
  define,$
*/
define(['angular', 'moment'], function (angular, moment) {
    'use strict';
    var KPIOverviewController = ['$scope', '$http', 'Uri', 'camAPI', function ($scope, $http, Uri, camAPI) {
        // get the 'creation time date' of task
        var defaultParams = {
            processInstanceId: $scope.processInstance.id
        };

        $http.post(Uri.appUri(CONST_REST_URLS.task), defaultParams).success(function (data) {
            $scope.restTasks = data;
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function (data) {

                var userTasks = [];
                if (data.bpmnElements != null) {
                    Object.keys(data.bpmnElements).filter(function (element) {
                        if (data.bpmnElements[element].$type === CONST_BPMN_TYPES.userTask) {
                            userTasks.push(data.bpmnElements[element]);
                        }
                    });
                }

                userTasks.forEach(function (userTask, index) {

                    //add the KPI data from processDefinition
                    userTask.kpiData = [];
                    userTask.kpiData.push({
                        'kpi': userTask.$attrs['camunda:kpi'],
                        'kpiunit': userTask.$attrs['camunda:kpiunit']
                    });

                    //add restData to task
                    $scope.restTasks.filter(function (restTask) {
                        if (restTask.taskDefinitionKey === userTask.id) {
                            userTask.restTask = restTask;
                            userTask.restTask.activityId = userTask.restTask.taskDefinitionKey + ':' + userTask.restTask.id;
                            userTask.link = '#/process-instance/' + $scope.processInstance.id + '?detailsTab=kpi-overview&activityInstanceIds=' + userTask.restTask.activityId;

                            if (userTask.restTask.created != null) {
                                var creationMoment = new moment(userTask.restTask.created);
                                var currentMoment = new moment();
                                var diff = creationMoment.diff(currentMoment);
                                var duration = moment.duration(diff).humanize();
                                userTask.restTask.duration = duration;

                                var durationInUnit = currentMoment.diff(creationMoment, userTask.$attrs['camunda:kpiunit']);
                                userTask.restTask.durationInUnit = durationInUnit;
                                if (durationInUnit > userTask.$attrs['camunda:kpi']) {
                                    userTask.restTask.overdue = true;
                                    userTask.restTask.overdueTime = durationInUnit - parseInt(userTask.$attrs['camunda:kpi']) + userTask.$attrs['camunda:kpiunit'];
                                } else {
                                    userTask.restTask.overdue = false;
                                }
                            }
                            addOverlay(userTask);
                        }
                    });

                    //Try history data when no task is there
                    if (userTask.restTask == null) {
                        var historyParams = angular.copy(defaultParams);
                        historyParams.taskDefinitionKey = userTask.id;
                        $http.post(Uri.appUri(CONST_REST_URLS.historyTask), historyParams).success(function(data) {
                            if (data.length > 0) {
                                userTask.restTask = data[0];

                                var startMoment = new moment(userTask.restTask.startTime);
                                var endMoment = new moment(userTask.restTask.endTime);
                                var diff = endMoment.diff(startMoment);
                                var duration = moment.duration(diff).humanize();
                                userTask.restTask.duration = duration;

                                var durationInUnit = endMoment.diff(startMoment, userTask.$attrs['camunda:kpiunit']);
                                userTask.restTask.durationInUnit = durationInUnit;
                                if (durationInUnit > parseInt(userTask.$attrs['camunda:kpi'])) {
                                    userTask.restTask.overdue = true;
                                    userTask.restTask.overdueTime = durationInUnit - parseInt(userTask.$attrs['camunda:kpi']) + userTask.$attrs['camunda:kpiunit'];
                                } else {
                                    userTask.restTask.overdue = false;
                                }

                                userTasks[index] = userTask;
                                addOverlay(userTask);
                            }
                        });
                    }

                    userTasks[index] = userTask;
                });
                $scope.tasks = userTasks;
            });
        });

        function addOverlay(task) {
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
                var overlays = viewer.get('overlays');
                var htmlElement = '<div style="min-height: 20px; padding: 3px; background: white; border-radius:10px; border: 1px solid blue; color: black;">Target:' + task.kpiData[0].kpi + task.kpiData[0].kpiunit + '</div>';

                overlays.add(task.id, {
                    position: {
                        bottom: 10,
                        right: 50
                    },
                    html: htmlElement
                });

                if (task.restTask != null) {
                    var durationhtmlElement = '<div style="min-height: 20px; padding: 3px; background: white; border-radius:10px; border: 1px solid blue; color: black;">Current:' + task.restTask.durationInUnit + task.kpiData[0].kpiunit + '</div>';

                    overlays.add(task.id, {
                        position: {
                            bottom: -20,
                            right: 50
                        },
                        html: durationhtmlElement
                    });
                }
            });
        }

    }];

    var Configuration = ['ViewsProvider', function(ViewsProvider) {
        ViewsProvider.registerDefaultView('cockpit.processInstance.runtime.tab', {
            id: 'kpi-overview',
            label: 'KPI Overview',
            url: 'plugin://kpi-overview-plugin/static/app/kpi-overview-table.html',
            dashboardMenuLabel: 'KPI Overview',
            controller: KPIOverviewController,
            priority: 15
        });
    }];

    var ngModule = angular.module('cockpit.plugin.kpi-overview-plugin', []);
    ngModule.config(Configuration);
    return ngModule;
});
