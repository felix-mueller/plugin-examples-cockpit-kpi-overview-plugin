ngDefine('cockpit.plugin.kpi-overview-plugin.controllers',[], function(module) {
	module.controller('kpiProcessController', ['$scope', 'filterFilter', '$http', 'Uri', 'camAPI', 'constants', 'kpiExtractor', function ($scope, filterFilter, $http, Uri, camAPI, constants, kpiExtractor) {
    	var overlayIDs = [];
    	
    	//clean diagram on destroy
    	 $scope.$on('$destroy', function iVeBeenDestroyed() {
         	angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
             	if (viewer) {
 	                var overlays = viewer.get('overlays');
 	                overlayIDs.forEach(function(id) {
 	                	overlays.remove(id);
 	                });
 	                overlayIDs = [];
             	}
         	});
         });
    	 
    	$scope.cssPath = constants.CONST_PLUGIN_PATH.CSS;
        $scope.tasks = {};
        
        $scope.$watch('pages.current', function (newValue, oldValue) {
        	if (newValue === oldValue) {
        		return;
        	}
        	updateView();
        });
        
        $scope.pages = {
        	current: 1,
        	size: constants.QUERY_MAX_RESULTS,
        };
        $http.get(Uri.appUri(constants.CONST_REST_URLS.historyProcessInstanceCount)).success(function(result) {
        	$scope.pages.total = result.count;
        	updateView();
        });
        function updateView() {
        	 $scope.tasks = {};
        	 
        	//get statistis for overlay
        	angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
        		var statisticQuery = [];
        		console.log(data);
        		if (data != null && data.bpmnElements != null) {
                    Object.keys(data.bpmnElements).forEach(function(key) {
                    	var bpmnElement = data.bpmnElements[key];
                    	if (constants.CONST_BPMN_TYPES.indexOf(bpmnElement.$type) > -1) {
	                        //add the KPI data from processDefinition
                    		var kpiData = kpiExtractor.extract(bpmnElement.extensionElements);
	                        var element = {
	                        	taskId: bpmnElement.id,
	                        	kpiUnit: kpiData.kpiunit,
	                        	kpi: kpiData.kpi
	                        };
	                        statisticQuery.push(element);
                    	}
                    });
        		}
        		console.log(statisticQuery);
        		if (statisticQuery.length>0) {
        			$http.get(Uri.appUri(constants.CONST_REST_URLS.historyCustomStatistic),{
            			params: {
            				'processDefinitionId': $scope.processDefinition.id,
            				'statisticData': JSON.stringify(statisticQuery)
            			}
            		}).success(function(statistic) {
            			statistic.forEach(function(statistic) {
            				if (statistic.count != 0) {
            					addOverlay(statistic.activityId, statistic.count);
            				}
                        });
            		});
        		}
        	});
        	 
        	
	        //get history for this process to calculate average duration
	        $http.get(Uri.appUri(constants.CONST_REST_URLS.historyProcessInstance),{
	        	params: {
	                'processDefinitionId': $scope.processDefinition.id,
	                'firstResult': ($scope.pages.current -1) * $scope.pages.size,
	                'maxResults': $scope.pages.size,
	                'sortBy': 'startTime',
	                'sortOrder': 'desc'
	            }
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
	                            	var extensionElements = bpmnElement.extensionElements;
	                            	var kpiInformation = kpiExtractor.extract(extensionElements);
	                            	
	                                var targetduration = kpiInformation.kpi + kpiInformation.kpiunit;
	                                processInstances[index].targetDuration = targetduration;
	                                processInstances[index].currentDuration = endTimeMoment.diff(startTimeMoment, kpiInformation.kpiunit);
	                                processInstances[index].currentDurationInUnit = processInstances[index].currentDuration + kpiInformation.kpiunit;
	                                durations+=processInstances[index].currentDuration;
	                                
	                                if (processInstances[index].currentDuration > parseInt(kpiInformation.kpi)) {
	                                    processInstances[index].overdue = true;
	                                    processInstances[index].overdueInUnit = (parseInt(processInstances[index].currentDuration) - parseInt(processInstances[index].targetDuration)) + bpmnElement.$attrs['camunda:kpiunit'];
	                                } else {
	                                    processInstances[index].overdue = false;
	                                }
	                                processInstances[index].unit = kpiInformation.kpiunit;
	                            }
	                        });
	                        if ($scope.processGeneral) {
	                            $scope.processGeneral.avgDuration = (durations / processInstances.length);
	                        } else {
	                            $scope.processGeneral = {
	                                'avgDuration': (durations / processInstances.length)
	                            };
	                        }
	                    }
	                });
	                
	                
	
	                //get tasks and check overdue for them
	                var defaultParams = {
	                    processInstanceId: instance.id
	                };
	
	                $http.post(Uri.appUri(constants.CONST_REST_URLS.historyActivityInstance), defaultParams).success(function(activityInstances) {
	
	                    var taskActivityInstances = activityInstances.filter(function(activityInstance) {
	                        if (constants.CONST_TASK_TYPES.indexOf(activityInstance.activityType) > -1) {
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
	                                bpmnElement.kpiData = kpiExtractor.extract(bpmnElement.extensionElements);
	
	                                if (constants.CONST_BPMN_TYPES.indexOf(bpmnElement.$type) > -1) {
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
	                                            
	                                            if (bpmnElement.kpiData) {
		                                            var durationInUnit = endMoment.diff(startMoment, bpmnElement.kpiData.kpi);
		                                            
		                                            bpmnElement.taskActivity.duration = duration;
		                                            if (durationInUnit > parseInt(bpmnElement.kpiData.kpi)) {
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
	
	        });
        }

        function addOverlay(task, amount) {
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
                var overlays = viewer.get('overlays');
                var htmlElement = '<div class="kpi-process-overlay-info" tooltip="Task overdue in ' + amount + ' instances"><span >' + amount + '</span></div>';
                var $element = $(htmlElement);
                $element.on('click', function (event) {
                	$scope.processInstances = filterFilter($scope.processInstancesOriginal,{'tasksOverdueIds':task});
                	$scope.$apply();
                });
                
                var overlay = overlays.add(task, {
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
                overlayIDs.push(overlay);
            });
        }
        
        $scope.getLink = function(id, taskId) {
        	return '#/process-definition/' + $scope.processDefinition.id + '/history?detailsTab=kpi-overview-definition&activityIds=' + taskId;
        };
        $scope.getLinkInst = function(processInst) {
        	var tasks = processInst.tasksOverdueIds.join(',');
        	
        	return '#/process-definition/' + $scope.processDefinition.id + '/history?detailsTab=kpi-overview-definition&activityIds=' + tasks;
        }
       
    }])
   });   
