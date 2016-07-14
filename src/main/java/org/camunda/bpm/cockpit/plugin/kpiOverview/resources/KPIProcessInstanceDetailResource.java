package org.camunda.bpm.cockpit.plugin.kpiOverview.resources;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.logging.Logger;

import javax.ws.rs.GET;

import org.camunda.bpm.cockpit.db.QueryParameters;
import org.camunda.bpm.cockpit.plugin.kpiOverview.dto.ProcessInstanceDetailsDto;
import org.camunda.bpm.cockpit.plugin.resource.AbstractCockpitPluginResource;

public class KPIProcessInstanceDetailResource extends AbstractCockpitPluginResource {

  private String processInstanceId;
  private final Logger LOGGER = Logger.getLogger(KPIProcessInstanceDetailResource.class.getName());

  public KPIProcessInstanceDetailResource(String engineName, String processInstanceId) {
    super(engineName);
    this.processInstanceId = processInstanceId;
  }

  @GET
  public ProcessInstanceDetailsDto getProcessInstanceDetails() {
    HashMap<String, String> parameters = new HashMap<String, String>();
    parameters.put("processInstanceId", processInstanceId);

    QueryParameters<ProcessInstanceDetailsDto> queryParameters = new QueryParameters<ProcessInstanceDetailsDto>();
    queryParameters.setParameter(parameters);
    List<ProcessInstanceDetailsDto> result = getQueryService().executeQuery("cockpit.kpi.selectProcessInstanceDetails", queryParameters);

    if(result.size()>0) {
    	return result.get(0);
    } else {
    	return null;
    }
  }

}
