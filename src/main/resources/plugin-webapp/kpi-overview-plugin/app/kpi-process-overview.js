define(['angular', 'moment'], function(angular, moment) {
    'use strict';
    var CONST_REST_URLS = {
            'historyActivityInstance': 'engine://engine/:engine/history/activity-instance',
            'historyProcessInstance': 'engine://engine/:engine/history/process-instance/'
        },
        CONST_TASK_TYPES = [
            'userTask', 'scriptTask', 'serviceTask', 'sendTask', 'receiveTask', 'businessRuleTask'
        ];
        
    var KPIProcessOverviewController = ['$scope', 'filterFilter', '$http', 'Uri', 'camAPI', function($scope, filterFilter, $http, Uri, camAPI) {
        $scope.tasks = {};
        $scope.$watch('tasks', function(tasks) {
            Object.keys(tasks).forEach(function(key) {
                addOverlay(key, $scope.tasks[key]);
            });
        }, true);
        //get history for this process to calculate average duration
        $http.get(Uri.appUri(CONST_REST_URLS.historyProcessInstance), {
            'processDefinitionId': $scope.processDefinition.id
        }).success(function(processInstances) {
            var durations = 0;

            processInstances.forEach(function(instance, index) {
                var tasksOverdue = 0;
                var completedTasksOverdue = 0;
                var tasksOverdueIds = [];
                var startTimeMoment = new moment(instance.startTime);
                if (instance.endTime) {
                    var endTimeMoment = new moment(instance.endTime);
                } else {
                    var endTimeMoment = new moment();
                }

                processInstances[index].link = '#/process-instance/' + instance.id + '/history?detailsTab=kpi-overview';

                angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
                    if (data != null && data.bpmnElements != null) {
                        Object.keys(data.bpmnElements).forEach(function(key) {
                            var bpmnElement = data.bpmnElements[key];
                            if (bpmnElement.$type === 'bpmn:Process') {
                                var kpiInformation = bpmnElement.$attrs['camunda:kpi'] + bpmnElement.$attrs['camunda:kpiunit'];
                                processInstances[index].targetDuration = kpiInformation;


                                processInstances[index].currentDuration = endTimeMoment.diff(startTimeMoment, bpmnElement.$attrs['camunda:kpiunit']);
                                processInstances[index].currentDurationInUnit = processInstances[index].currentDuration + bpmnElement.$attrs['camunda:kpiunit'];

                                if (processInstances[index].currentDuration > parseInt(bpmnElement.$attrs['camunda:kpi'])) {
                                    processInstances[index].overdue = true;
                                    processInstances[index].overdueInUnit = (parseInt(processInstances[index].currentDuration) - parseInt(processInstances[index].targetDuration)) + bpmnElement.$attrs['camunda:kpiunit'];

                                } else {
                                    processInstances[index].overdue = false;
                                }
                            }
                        });
                    }
                });



                //get tasks and check overdue for them
                var defaultParams = {
                    processInstanceId: instance.id
                };

                $http.post(Uri.appUri(CONST_REST_URLS.historyActivityInstance), defaultParams).success(function(activityInstances) {

                    var taskActivityInstances = activityInstances.filter(function(activityInstance) {
                        if (CONST_TASK_TYPES.indexOf(activityInstance.activityType) > -1) {
                            return true;
                        } else {
                            return false;
                        }
                    });


                    angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
                        if (data != null && data.bpmnElements != null) {
                            Object.keys(data.bpmnElements).forEach(function(key) {
                                var bpmnElement = data.bpmnElements[key];
                                //add the KPI data from processDefinition
                                bpmnElement.kpiData = [];
                                bpmnElement.kpiData.push({
                                    'kpi': bpmnElement.$attrs['camunda:kpi'],
                                    'kpiunit': bpmnElement.$attrs['camunda:kpiunit']
                                });

                                if (CONST_BPMN_TYPES.indexOf(bpmnElement.$type) > -1) {
                                    taskActivityInstances.forEach(function(taskActivity) {
                                        if (taskActivity.activityId === bpmnElement.id) {
                                            bpmnElement.taskActivity = taskActivity;

                                            var startMoment = new moment(taskActivity.startTime);
                                            if (taskActivity.endTime) {
                                                var endMoment = new moment(taskActivity.endTime);
                                            } else {
                                                var endMoment = new moment();
                                            }
                                            var diff = endMoment.diff(startMoment);
                                            var duration = moment.duration(diff).humanize();
                                            var durationInUnit = endMoment.diff(startMoment, bpmnElement.$attrs['camunda:kpiunit']);

                                            bpmnElement.taskActivity.duration = duration;
                                            if (durationInUnit > parseInt(bpmnElement.$attrs['camunda:kpi'])) {
                                                bpmnElement.taskActivity.overdue = true;
                                                if (taskActivity.endTime) {
                                                    completedTasksOverdue++;
                                                } else {
                                                    tasksOverdue++;
                                                    tasksOverdueIds.push(bpmnElement.id);
                                                    var tasks = $scope.tasks;
                                                    if (tasks[bpmnElement.id]) {
                                                        tasks[bpmnElement.id] = tasks[bpmnElement.id] + 1;
                                                    } else {
                                                        tasks[bpmnElement.id] = 1;
                                                    }
                                                    $scope.tasks = tasks;
                                                }
                                            } else {
                                                bpmnElement.taskActivity.overdue = false;
                                            }

                                            return true;
                                        }
                                    });



                                }
                            });

                            processInstances[index].tasksOverdueIds = tasksOverdueIds
                            processInstances[index].completedtasksoverdue = completedTasksOverdue;
                            processInstances[index].tasksoverdue = tasksOverdue;
                        }
                    });
                });

                $scope.processInstances = processInstances;
                $scope.processInstancesOriginal = processInstances;

            });


            if ($scope.processInst) {
                $scope.processInst.avgDuration = (durations / processInstances.length);
            } else {
                $scope.processInst = {
                    'avgDuration': (durations / processInstances.length)
                };
            }


        });


        function addOverlay(task, amount) {
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
                var overlays = viewer.get('overlays');
                var htmlElement = '<div style="width:20px; height:20px; line-height: 21px; text-align: center; border-radius: 10px; background: #b5152b; border: 1px solid black; color: black; " tooltip="Task overdue in ' + amount + ' instances"><span >' + amount + '</span></div>';
                var $element = $(htmlElement);
                $element.on('click', function (event) {
                	console.log(event, task);
                	$scope.processInstances = filterFilter($scope.processInstancesOriginal,{'tasksOverdueIds':task});
                	$scope.$apply();
                });
                //angular.element(htmlElement).handler('click', function)
                overlays.add(task, {
                    position: {
                        top: -10,
                        right: 10
                    },
                    show: {
                    	minZoom: 0,
                    	maxZoom: 50
                    },
                    html: $element
                });
                
            });
        }
    }];

    var Configuration = ['ViewsProvider', function(ViewsProvider) {
        ViewsProvider.registerDefaultView('cockpit.processDefinition.history.tab', {
            id: 'kpi-overview-definition',
            label: 'KPI Overview ',
            url: 'plugin://kpi-overview-plugin/static/app/kpi-process-overview.html',
            dashboardMenuLabel: 'KPI Overview',
            controller: KPIProcessOverviewController
        });
    }];


    var ngModule = angular.module('cockpit.plugin.kpi-process-overview-plugin', []);
    ngModule.config(Configuration);

    return ngModule;
});
