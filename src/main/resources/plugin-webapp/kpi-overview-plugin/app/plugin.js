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
    'historyActivityInstance': 'engine://engine/:engine/history/activity-instance',
    'historyProcessInstance': 'engine://engine/:engine/history/process-instance/'
};
/*global
  define,$
*/
define(['angular', 'moment', './kpi-process-overview'], function(angular, moment, kpiprocessoverview) {
    'use strict';
    var KPIOverviewController = ['$scope', '$http', 'Uri', 'camAPI', function($scope, $http, Uri, camAPI) {
    	var overlayIDs= [];
    	
        $scope.typeFilters = CONST_BPMN_TYPES;
        
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
        $http.get(Uri.appUri(CONST_REST_URLS.historyProcessInstance + $scope.processInstance.id), {}).success(function(data) {
            if ($scope.processInst) {
                $scope.processInst.startTime = data.startTime;
            } else {
                $scope.processInst = data;
            }

            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
                if (data != null && data.bpmnElements != null) {
                    Object.keys(data.bpmnElements).forEach(function(key) {
                        var bpmnElement = data.bpmnElements[key];
                        if (bpmnElement.$type === 'bpmn:Process') {
                            var kpiInformation = bpmnElement.$attrs['camunda:kpi'] + bpmnElement.$attrs['camunda:kpiunit'];
                            $scope.processInst.targetDuration = kpiInformation;

                            var creationMoment = new moment($scope.processInst.startTime);
                            var currentMoment = new moment();
                            $scope.processInst.currentDuration = currentMoment.diff(creationMoment, bpmnElement.$attrs['camunda:kpiunit']) + bpmnElement.$attrs['camunda:kpiunit'];
                            //var durationInUnit = currentMoment.diff(creationMoment, bpmnElement.$attrs['camunda:kpiunit']);

                            if ($scope.processInst.currentDuration > parseInt(bpmnElement.$attrs['camunda:kpi'])) {
                                $scope.processInst.overdue = true;
                            } else {
                                $scope.processInst.overdue = false;
                            }
                        }
                    });
                }
            });
        });


        $http.post(Uri.appUri(CONST_REST_URLS.historyActivityInstance), defaultParams).success(function(activityInstances) {
        	var activityNames = [];
            var taskActivityInstances = activityInstances.filter(function(activityInstance) {
            	activityNames.push(activityInstance.activityId);
                if (CONST_TASK_TYPES.indexOf(activityInstance.activityType) > -1) {
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
                                    bpmnElement.link = '#/process-instance/' + $scope.processInstance.id + '/history?detailsTab=kpi-overview&activityInstanceIds=' + bpmnElement.taskActivity.id;

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
          //  animateProcessInstancePath(activityNames);

        });

        function animateProcessInstancePath(activities) {
           angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
              if (viewer) {
	        	  var overlays = viewer.get('overlays');
	              var htmlElement = $('<div style="width:100%; height:100%;"></div>');
	              var overlay = overlays.add(activities[0], {
	                  position: {
	                      top: 0,
	                      left: 0
	                  },
	                  html: htmlElement,
	                  show: {
	                    	minZoom: 0,
	                    	maxZoom: 50
	                    }
	              });
	              overlayIDs.push(overlay);
	              $(overlays.get(overlay).htmlContainer).css("border-radius","10px").css("border","3px solid #276e8c").css("height",viewer.get('canvas')._elementRegistry._elements[activities[0]].element.height).css("width",viewer.get('canvas')._elementRegistry._elements[activities[0]].element.width);
	              //var addx = viewer.get('canvas')._elementRegistry._elements[activities[1]].element.x-viewer.get('canvas')._elementRegistry._elements[activities[0]].element.x;
	              //var addy = viewer.get('canvas')._elementRegistry._elements[activities[1]].element.y-viewer.get('canvas')._elementRegistry._elements[activities[0]].element.y;
	              animate(viewer, $(overlays.get(overlay).htmlContainer),activities,0,overlay);
              }
          });
        };

        function animate(viewer, container, activities, number, overlay) {

        	var activityA = activities[number+1];
        	var activityB = activities[number];
        	number++;
        	if ( activityA && activityB ) {

        		var a = viewer.get('canvas')._elementRegistry._elements[activityA].element;
        		var b = viewer.get('canvas')._elementRegistry._elements[activityB].element;

	            if (b.type==='bpmn:ParallelGateway' && b.outgoing.length>1) {
	            
	            	var overlays = viewer.get('overlays');
	            	overlays.remove(overlay)
	            	b.outgoing.forEach(function(outgoing) {
	            		var realElement = Object.keys(viewer.get('canvas')._elementRegistry._elements).filter(function(item) {
	            			if (viewer.get('canvas')._elementRegistry._elements[item].element.incoming.contains(outgoing)) {
	            				return true;
	            			}
	            		});
	            		var htmlElement = $('<div style="width:100%; height:100%;"></div>');
	            		console.log(realElement);
			              var overlay = overlays.add(b.id, {
			                  position: {
			                      top: 0,
			                      left: 0
			                  },
			                  html: htmlElement,
			                  show: {
			                    	minZoom: 0,
			                    	maxZoom: 50
			                    }
			              });
			              overlayIDs.push(overlay);
			              var a = viewer.get('canvas')._elementRegistry._elements[realElement[0]].element;
			              var addx = a.x-b.x;
				            var addy = a.y-b.y;
				          $(overlays.get(overlay).htmlContainer).css("border-radius","10px").css("border","3px solid #276e8c").css("height",viewer.get('canvas')._elementRegistry._elements[activities[0]].element.height).css("width",viewer.get('canvas')._elementRegistry._elements[activities[0]].element.width);
				             
				          $(overlays.get(overlay).htmlContainer).animate({
			   	           	 left: "+="+addx,
			   	        	 top: "+="+addy,
			   	        	 height:a.height+"px",
			   	        	 width:a.width+"px"
			   	          },2000, function() {
			   	        	  if (number <= activities.length) {
			   	        		  animate(viewer, container, activities, number);
			   	        	  }
			   	          });
	            	});
		              
	            } else {
	        		var addx = a.x-b.x;
		            var addy = a.y-b.y;
	            	container.animate({
	   	           	 left: "+="+addx,
	   	        	 top: "+="+addy,
	   	        	 height: viewer.get('canvas')._elementRegistry._elements[activityA].element.height+"px",
	   	        	 width: viewer.get('canvas')._elementRegistry._elements[activityA].element.width+"px"
	   	          },2000, function() {
	   	        	  if (number <= activities.length) {
	   	        		  animate(viewer, container, activities, number, overlay);
	   	        	  }
	   	          });
	            }
	            /*
	            if (viewer.get('canvas')._elementRegistry._elements[activityA].element.incoming && viewer.get('canvas')._elementRegistry._elements[activityA].element.incoming[0].waypoints) {

	            	for (var i = 0; i+1 < viewer.get('canvas')._elementRegistry._elements[activityA].element.incoming[0].waypoints.length; i++) {
	            		var startpoint = viewer.get('canvas')._elementRegistry._elements[activityA].element.incoming[0].waypoints[i];
	            		var endpoint = viewer.get('canvas')._elementRegistry._elements[activityA].element.incoming[0].waypoints[i+1];
	            		var lineaddx = endpoint.x-startpoint.x;
	            		var lineaddy = endpoint.y-startpoint.y;

	            		container.queue("steps", function() {
	            			container.animate({
	            				left:"+="+lineaddx,
	            				top:"+="+lineaddy
	            			 },5000
	            			);
	            		});
	            	}

	            	container.dequeue("steps");
	            }
	            */

	        	
        	}
        }

        function addOverlay(task) {
            angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer', function(viewer) {
            	if (viewer) {
	                var overlays = viewer.get('overlays');
	                if (task.kpiData != null && task.kpiData.length > 0 && task.kpiData[0].kpi != null) {
	                    if (task.taskActivity != null && task.taskActivity.overdue) {
	                        var htmlElement = '<div style="width:25px; height:25px; font-size:20px; line-height: 21px; text-align: center; border-radius: 10px; color: #b5152b;"><span class="glyphicon glyphicon-exclamation-sign"></span></div>';
	                    } else if (task.taskActivity != null && !task.taskActivity.overdue) {
	                        var htmlElement = '<div style="width:25px; height:25px; font-size:20px; line-height: 21px; text-align: center; border-radius: 10px; color: green; "><span class="glyphicon glyphicon-ok-sign"></span></div>';

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

    }];

    var Configuration = ['ViewsProvider', function(ViewsProvider) {
        ViewsProvider.registerDefaultView('cockpit.processInstance.history.tab', {
            id: 'kpi-overview',
            label: 'KPI Overview',
            url: 'plugin://kpi-overview-plugin/static/app/kpi-overview-table.html',
            dashboardMenuLabel: 'KPI Overview',
            controller: KPIOverviewController,
            priority: 15
        });
    }];  
    
    
    var ngModule = angular.module('cockpit.plugin.kpi-overview-plugin', ['cockpit.plugin.kpi-process-overview-plugin']);
    ngModule.config(Configuration);

    return ngModule;
});
