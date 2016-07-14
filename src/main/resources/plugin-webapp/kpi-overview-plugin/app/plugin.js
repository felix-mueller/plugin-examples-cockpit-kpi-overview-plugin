var CONST_BPMN_TYPES = [
    'bpmn:UserTask',
    'bpmn:ScriptTask',
    'bpmn:ServiceTask',
    'bpmn:SendTask',
    'bpmn:ReceiveTask',
    'bpmn:BusinessRuleTask'
];
var CONST_TASK_TYPES = [
		'userTask', 'scriptTask', 'serviceTask', 'sendTask', 'receiveTask', 'businessRuleTask'
];
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

        $http.post(Uri.appUri(CONST_REST_URLS.historyActivityInstance), defaultParams).success(function (activityInstances) {
        	
        	var taskActivityInstances = activityInstances.filter(function(activityInstance) {
        		if (CONST_TASK_TYPES.indexOf(activityInstance.activityType)>-1) {
        			return true;
        		} else {
        			return false;
        		}
        	});
        	
        	var tasks = [];
        	angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function (data) {
        		if (data.bpmnElements != null) {
        			Object.keys(data.bpmnElements).forEach(function(key) {
        				var bpmnElement = data.bpmnElements[key];
        				//add the KPI data from processDefinition
                        bpmnElement.kpiData = [];
                        bpmnElement.kpiData.push({
                            'kpi': bpmnElement.$attrs['camunda:kpi'],
                            'kpiunit': bpmnElement.$attrs['camunda:kpiunit']
                        });
        				if (CONST_BPMN_TYPES.indexOf(bpmnElement.$type)>-1) {
        					taskActivityInstances.forEach(function(taskActivity) {
        						if (taskActivity.activityId === bpmnElement.id) {
        							bpmnElement.taskActivity = taskActivity;
        							bpmnElement.link = '#/process-instance/' + $scope.processInstance.id + '?detailsTab=kpi-overview&activityInstanceIds=' + bpmnElement.taskActivity.activityId;
        							
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
                                    bpmnElement.taskActivity.durationInUnit = durationInUnit;
                                    if (durationInUnit > parseInt(bpmnElement.$attrs['camunda:kpi'])) {
                                    	bpmnElement.taskActivity.overdue = true;
                                    	bpmnElement.taskActivity.overdueTime = durationInUnit - parseInt(bpmnElement.$attrs['camunda:kpi']) + bpmnElement.$attrs['camunda:kpiunit'];
                                    } else {
                                    	bpmnElement.taskActivity.overdue = false;
                                    }
        							
        							return true;
        						}
        					});

        					tasks.push(bpmnElement);
        					addOverlay(bpmnElement);
        				}
        			});
        			$scope.tasks = tasks;
        		}
        	});
        });
        

        function addOverlay(task) {
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
                var overlays = viewer.get('overlays');
                if ( task.kpiData != null && task.kpiData.length>0 && task.kpiData[0].kpi != null) {
	                //var htmlElement = '<div style="min-height: 20px; padding: 3px; background: #70b8db; border-radius:10px; border: 1px solid black; color: black;">Target:' + task.kpiData[0].kpi + task.kpiData[0].kpiunit + '</div>';
                	if (task.taskActivity != null && task.taskActivity.overdue) {
                		var htmlElement = '<div style="width:20px; height:20px; line-height: 21px; text-align: center; border-radius: 10px; background: red; border: 1px solid black; color: black;"><span class="glyphicon glyphicon-exclamation-sign"></span></div>';
                	} else if (task.taskActivity != null && !task.taskActivity.overdue){
                		var htmlElement = '<div style="width:20px; height:20px; line-height: 21px; text-align: center; border-radius: 10px; background: green; border: 1px solid black; color: black; "><span class="glyphicon glyphicon-ok"></span></div>';
                    	
                	}
                	
	                overlays.add(task.id, {
	                    position: {
	                        bottom: 10,
	                        right: 10
	                    },
	                    html: htmlElement
	                });
                }
	                
                if (task.restTask != null) {
                    var durationhtmlElement = '<div style="min-height: 20px; padding: 3px; background: #70b8db; border-radius:10px; border: 1px solid red; color: black;">Current:' + task.taskActivity.durationInUnit + task.kpiData[0].kpiunit + '</div>';

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
