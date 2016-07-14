var CONST_BPMN_TYPES = {
    'all': '',
    'userTask': 'bpmn:UserTask',
    'scriptTask': 'bpmn:ScriptTask'
};
var CONST_REST_URLS = {
    'task': 'engine://engine/:engine/task/',
    'historyTask': 'engine://engine/:engine/history/task/',
    'processInstance': 'plugin://kpi-overview-plugin/:engine/process-instance-detail/',
    'processDefinitionHistory': 'plugin://kpi-overview-plugin/:engine/process-definition-history/',
    'historyActivityInstance': 'engine://engine/:engine/history/activity-instance'
};
/*global
  define,$
*/
define(['angular', 'moment'], function (angular, moment) {
    'use strict';
    var KPIOverviewController = ['$scope', '$http', 'Uri', 'camAPI', function ($scope, $http, Uri, camAPI) {
        $scope.typeFilters = CONST_BPMN_TYPES;

        // get the 'creation time date' of task
        var defaultParams = {
            processInstanceId: $scope.processInstance.id
        };

        //get start time for current process instance
        $http.get(Uri.appUri(CONST_REST_URLS.processInstance+$scope.processInstance.id), {}).success(function (data) {
        	if ($scope.processInst) {
        		$scope.processInst.startTime = data.startTime;
        	} else {
        		$scope.processInst = data;
        	}
        	
        	var creationMoment = new moment(data.startTime);
            var currentMoment = new moment();
            var diff = currentMoment.diff(creationMoment);
            $scope.processInst.currentDuration = moment.duration(diff).humanize();
        });
        
        //get history for this process to calculate average duration
        $http.get(Uri.appUri(CONST_REST_URLS.processDefinitionHistory+$scope.processInstance.definitionId), {}).success(function (data) {
            var durations = 0;
            
            data.forEach( function (instance) {
            	var startTimeMoment = new moment(instance.startTime);
            	var endTimeMoment = new moment(instance.endTime);
            	durations += parseInt(endTimeMoment.diff(startTimeMoment));
            });
            if ($scope.processInst) {
            	$scope.processInst.avgDuration = (durations / data.length);
            } else {
            	$scope.processInst = {
            			'avgDuration': (durations / data.length)
            	};
            }
        	console.log(data);
         });

        // get active tasks for the process instance
        $http.post(Uri.appUri(CONST_REST_URLS.task), defaultParams).success(function (data) {
            $scope.restTasks = data;
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function (data) {

                var userTasks = [];
                if (data.bpmnElements != null) {
                    Object.keys(data.bpmnElements).filter(function (element) {
                        if (data.bpmnElements[element].$type === CONST_BPMN_TYPES.userTask || data.bpmnElements[element].$type === CONST_BPMN_TYPES.scriptTask) {
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

                        //get the history only for one specific task
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
                var htmlElement = '<div style="min-height: 20px; padding: 3px; background: #70b8db; border-radius:10px; border: 1px solid black; color: black;">Target:' + task.kpiData[0].kpi + task.kpiData[0].kpiunit + '</div>';

                overlays.add(task.id, {
                    position: {
                        bottom: 10,
                        right: 50
                    },
                    html: htmlElement
                });

                if (task.restTask != null) {
                    var durationhtmlElement = '<div style="min-height: 20px; padding: 3px; background: #70b8db; border-radius:10px; border: 1px solid red; color: black;">Current:' + task.restTask.durationInUnit + task.kpiData[0].kpiunit + '</div>';

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
