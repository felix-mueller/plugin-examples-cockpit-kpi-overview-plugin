define(['angular','moment'], function(angular,moment) {
  var KPIOverviewController = ['$scope', '$http', 'Uri','camAPI','Transform', function( $scope,   $http,   Uri, camAPI, Transform) {
	// get the 'creation time date' of task
	var defaultParams = {
    	processInstanceId: $scope.processInstance.id
    };
	$http.post(Uri.appUri('engine://engine/:engine/task/'), defaultParams).success(function(data) {
		$scope.restTasks = data;
		angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('processDiagram', function(data) {
		console.log(data.bpmnElements);
		var userTasks = [];
		if (data.bpmnElements != null) {
			Object.keys(data.bpmnElements).filter(function(element) {
				if (data.bpmnElements[element].$type==='bpmn:UserTask') {
					userTasks.push(data.bpmnElements[element]);
				}
			});
		}
		
		
		$scope.tasks = userTasks;
		userTasks.forEach(function(userTask,index) {
			
			$scope.restTasks.filter(function(restTask) {
				if (restTask.taskDefinitionKey === userTask.id) {
					userTask.restTask = restTask;
					userTask.restTask.activityId = userTask.restTask.taskDefinitionKey+':'+userTask.restTask.id;
					userTask.link = '#/process-instance/' + $scope.processInstance.id + '?detailsTab=kpi-overview&activityInstanceIds=' + userTask.restTask.activityId;
					
					if (userTask.restTask.created != null) {
						var creationMoment = new moment(userTask.restTask.created);
						var currentMoment = new moment();
						var diff = creationMoment.diff(currentMoment);
						var duration = moment.duration(diff).humanize();
						userTask.restTask.duration = duration;
						
						var durationInUnit = currentMoment.diff(creationMoment,userTask.$attrs['camunda:kpiunit']);
						userTask.restTask.durationInUnit = durationInUnit;
						if (durationInUnit > userTask.$attrs['camunda:kpi']) {
							userTask.restTask.overdue = true;
							userTask.restTask.overdueTime = durationInUnit-parseInt(userTask.$attrs['camunda:kpi']) + userTask.$attrs['camunda:kpiunit'];
						} else {
							userTask.restTask.overdue = false;
						}
					}
				}
			});
			
			//Try history data when no task is there
			if (userTask.restTask == null) {
				var historyParams = angular.copy(defaultParams);
				historyParams.taskDefinitionKey = userTask.id;
				$http.post(Uri.appUri('engine://engine/:engine/history/task/'), historyParams).success(function(data) {
					if (data.length>0) {
						userTask.restTask = data[0];
						
						var startMoment = new moment(userTask.restTask.startTime);
						var endMoment = new moment(userTask.restTask.endTime);
						var diff = endMoment.diff(startMoment);
						var duration = moment.duration(diff).humanize();
						userTask.restTask.duration = duration;
						
						var durationInUnit = endMoment.diff(startMoment,userTask.$attrs['camunda:kpiunit']);
						userTask.restTask.durationInUnit = durationInUnit;
						if (durationInUnit > parseInt(userTask.$attrs['camunda:kpi'])) {
							userTask.restTask.overdue = true;
							userTask.restTask.overdueTime = durationInUnit-parseInt(userTask.$attrs['camunda:kpi']) + userTask.$attrs['camunda:kpiunit'];
						} else {
							userTask.restTask.overdue = false;
						}
						
						userTasks[index] = userTask;
						$scope.tasks = userTasks;
					}
				});
			}
			
			
			userTask.kpiData = [];
			userTask.kpiData.push({
				'kpi': userTask.$attrs['camunda:kpi'],
				'kpiunit': userTask.$attrs['camunda:kpiunit']
			});
			
			
			$scope.$watch('tasks',function(tasks) {
				
					
					angular.element($('[cam-widget-bpmn-viewer]')).scope().$watch('viewer',function(viewer){
						for (var i=0;i<tasks.length;i++) {
							var task = tasks[i];
						var overlays = viewer.get('overlays');
						//overlays.clear();
						var htmlElement = '<div style="min-height: 20px; padding: 3px; background: white; border-radius:10px; border: 1px solid blue; color: black;">Target:'+task.kpiData[0].kpi+task.kpiData[0].kpiunit+'</div>';

						overlays.add(task.id, {
						    position: {
						        bottom: 10,
						        right: 50
						    },
						    html: htmlElement
						});
						
						if (task.restTask != null) {
							var durationhtmlElement ='<div style="min-height: 20px; padding: 3px; background: white; border-radius:10px; border: 1px solid blue; color: black;">Current:'+task.restTask.durationInUnit+task.kpiData[0].kpiunit+'</div>';
							
							overlays.add(task.id, {
							    position: {
							        bottom: -20,
							        right: 50
							    },
							    html: durationhtmlElement
							});
						}
						
						}
					});
				
			});
			
			
			
			
			
			/*
			 * 
			 * 
			 * Not used until extension Element fixed in modeller.
			 * if (userTask.extensionElements) {
				if (userTask.extensionElements.values) {
					userTask.extensionElements.values.filter(function(extensionElement) {
						if (extensionElement.$type === 'camunda:kpi') {
							userTask.kpiData.push({
								'kpi':extensionElement.kpi,
								'kpiunit':extensionElement.kpiuni
							});
						}
					});
				}
			}*/
		});
		
		$scope.tasks = userTasks;
	});
	});
	  
	  
	/*console.log($scope.processData.$providers.local);
	var processDefinitionId = $scope.processData.$providers.local.processDefinition.data.value.id;
	$scope.$watch('processData', function() {
		$scope.processData.$providers.get('bpmnElements', [ 'parsedBpmn20', function(parsedBpmn20) {
			parsedBpmn20.bpmnElements.filter(function(elements) {
				if (elements.$type==='bpmn:UserTask') {
					return true;
				} else {
					return false;
				}
			});
			console.log(userTasks);  
			
		 }]);		
	});
	*/
	
	/*
	$http.get(Uri.appUri('engine://engine/:engine/process-definition/'+processDefinitionId+'/xml')).success(function(data) {
				console.log("XML",data);
				var parsedXML = Transform.transformBpmn20Xml(data.bpmn20Xml);
				console.log(parsedXML);
        /*
				var viewer = new BpmnViewer();

				viewer.importXML(data, function(err) {

		    	  if (!err) {
		    	    console.log('success!');
		    	    var overlays = viewer.get('overlays');
		    	    console.log(overlays);
		    	    var startElements = [];
		    	    var processes = viewer.definitions.rootElements.filter(function(moddleElement) {
		    	      if (moddleElement.flowElements) {
		    	        moddleElement.flowElements.filter(function(flowElement) {
		    	          if (flowElement.$type === 'bpmn:StartEvent') {
		    	            startElements.push(flowElement);
		    	          }
		    	        })
		    	        return true;
		    	      }
		    	    });
		    	  }
				
				});
				
			});

	*/


  }];

  var Configuration = ['ViewsProvider', function(ViewsProvider) {

    ViewsProvider.registerDefaultView('cockpit.processInstance.runtime.tab', {
      id : 'kpi-overview',
      label : 'KPI Overview',
      url: 'plugin://kpi-overview-plugin/static/app/kpi-overview-table.html',
      dashboardMenuLabel: 'KPI Overview',
      controller : KPIOverviewController,
      priority : 15
    });
  }];

  var ngModule = angular.module('cockpit.plugin.kpi-overview-plugin', []);

  ngModule.config(Configuration);

  return ngModule;
});
