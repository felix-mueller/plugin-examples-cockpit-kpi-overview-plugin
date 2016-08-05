ngDefine('cockpit.plugin.kpi-overview-plugin.controllers',[], function(module) {
	module.controller('kpiTaskController', ['$scope', '$http', 'Uri', 'camAPI', 'constants', 'kpiExtractor', function($scope, $http, Uri, camAPI, constants, kpiExtractor) {
    	var overlayIDs= [];
    	$scope.cssPath = constants.CONST_PLUGIN_PATH.CSS;
        $scope.typeFilters = constants.CONST_BPMN_TYPES;
        
        $scope.$on('$destroy', function iVeBeenDestroyed() {
        	angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
            	if (viewer) {
	                var overlays = viewer.get('overlays');
	                overlayIDs.forEach(function(id) {
	                	overlays.remove(id);
	                });
            	}
        	});
        });
        
        // get the 'creation time date' of task
        var defaultParams = {
            processInstanceId: $scope.processInstance.id,
            sorting: [{sortBy: "occurrence", sortOrder: "asc"}]
        };

        //get start time for current process instance
        $http.get(Uri.appUri(constants.CONST_REST_URLS.historyProcessInstance + $scope.processInstance.id), {}).success(function(data) {
            if ($scope.processInst) {
                $scope.processInst.startTime = data.startTime;
            } else {
                $scope.processInst = data;
            }

            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
                if (data != null && data.bpmnElements != null) {
                    Object.keys(data.bpmnElements).forEach(function(key) {
                        var bpmnElement = data.bpmnElements[key];
                        if (bpmnElement.$type === 'bpmn:Process' || bpmnElement.$type === 'bpmn:Collaboration') {
                        	var extensionElements = bpmnElement.extensionElements;
                        	var kpiInformation = kpiExtractor.extract(extensionElements);
                            
                        	if (kpiInformation != null && kpiInformation.kpi != null) {
	                        	$scope.processInst.targetDuration = kpiInformation.kpi+kpiInformation.kpiunit;
	
	                            var creationMoment = new moment($scope.processInst.startTime);
	                            var currentMoment = new moment();
	                            
	                            if ($scope.processInst.endTime) {
	                            	currentMoment = new moment($scope.processInst.endTime);
	                            }
	                            
	                            var duration = currentMoment.diff(creationMoment, kpiInformation.kpiunit);
	                            $scope.processInst.currentDuration = duration + kpiInformation.kpiunit;
	                            
	                            if (duration > parseInt(kpiInformation.kpi)) {
	                                $scope.processInst.overdue = true;
	                                $scope.processInst.overdueDuration = (duration - parseInt(kpiInformation.kpi)) + kpiInformation.kpiunit;
	                            } else {
	                                $scope.processInst.overdue = false;
	                            }
                        	}
                        }
                    });
                }
            });
        });


        $http.post(Uri.appUri(constants.CONST_REST_URLS.historyActivityInstance), defaultParams).success(function(activityInstances) {
        	var activityNames = [];
            var taskActivityInstances = activityInstances.filter(function(activityInstance) {
            	activityNames.push(activityInstance.activityId);
                if (constants.CONST_TASK_TYPES.indexOf(activityInstance.activityType) > -1) {
                    return true;
                } else {
                    return false;
                }
            });

            var tasks = [];
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
                if (data != null && data.bpmnElements != null) {
                    Object.keys(data.bpmnElements).forEach(function(key) {
                        var bpmnElement = data.bpmnElements[key];
                        bpmnElement.kpiData = kpiExtractor.extract(bpmnElement.extensionElements);
                        if (constants.CONST_BPMN_TYPES.indexOf(bpmnElement.$type) > -1) {
                            taskActivityInstances.forEach(function(taskActivity) {
                                if (taskActivity.activityId === bpmnElement.id) {
                                    bpmnElement.taskActivity = taskActivity;
                                    bpmnElement.link = '#/process-instance/' + $scope.processInstance.id + '/history?detailsTab=kpi-overview&activityInstanceIds=' + bpmnElement.taskActivity.id;

                                    var startMoment = new moment(taskActivity.startTime);
                                    if (taskActivity.endTime) {
                                        var endMoment = new moment(taskActivity.endTime);
                                    } else {
                                        var endMoment = new moment();
                                    }
                                    var diff = endMoment.diff(startMoment);
                                    var duration = moment.duration(diff).humanize();
                                    var durationInUnit = endMoment.diff(startMoment, bpmnElement.kpiData['kpiunit']);

                                    bpmnElement.taskActivity.duration = duration;
                                    bpmnElement.taskActivity.durationInUnit = durationInUnit;
                                    if (durationInUnit > parseInt(bpmnElement.kpiData['kpi'])) {
                                        bpmnElement.taskActivity.overdue = true;
                                        bpmnElement.taskActivity.overdueTime = durationInUnit - parseInt(bpmnElement.kpiData['kpi']) + bpmnElement.kpiData['kpiunit'];
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
            	if (viewer) {
	                var overlays = viewer.get('overlays');
	                if (task.kpiData != null && task.kpiData.kpi != null) {
	                    if (task.taskActivity != null && task.taskActivity.overdue) {
	                        var htmlElement = '<div class="kpi-process-overlay-large kpi-process-overlay-red"><span class="glyphicon glyphicon-exclamation-sign"></span></div>';
	                    } else if (task.taskActivity != null && !task.taskActivity.overdue) {
	                        var htmlElement = '<div class="kpi-process-overlay-large kpi-process-overlay-green"><span class="glyphicon glyphicon-ok-sign"></span></div>';
	                    } else {
	                        var htmlElement = '<div></div>';
	                    }

	                    var overlay = overlays.add(task.id, {
	                        position: {
	                            top: -10,
	                            right: 8
	                        },
	                        show: {
	                        	minZoom: 0,
	                        	maxZoom: 50
	                        },
	                        html: htmlElement
	                    });
	                    overlayIDs.push(overlay);
	                }
            	}
            });
        }
	 }])});   