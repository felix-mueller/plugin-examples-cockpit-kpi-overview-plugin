package org.camunda.bpm.cockpit.plugin.kpiOverview.resources;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.logging.Logger;

import javax.ws.rs.GET;

import org.camunda.bpm.cockpit.db.QueryParameters;
import org.camunda.bpm.cockpit.plugin.kpiOverview.dto.ProcessDefinitionHistoryDetailsDto;
import org.camunda.bpm.cockpit.plugin.resource.AbstractCockpitPluginResource;

public class KPIProcessDefinitionHistoryResource extends AbstractCockpitPluginResource {

  private String processDefinitionId;
  private final Logger LOGGER = Logger.getLogger(KPIProcessDefinitionHistoryResource.class.getName());

  public KPIProcessDefinitionHistoryResource(String engineName, String processDefinitionId) {
    super(engineName);
    this.processDefinitionId = processDefinitionId;
  }

  @GET
  public List<ProcessDefinitionHistoryDetailsDto> getProcessDefinitionHistoryResource() {
    HashMap<String, String> parameters = new HashMap<String, String>();
    parameters.put("processDefinitionId", processDefinitionId);

    QueryParameters<ProcessDefinitionHistoryDetailsDto> queryParameters = new QueryParameters<ProcessDefinitionHistoryDetailsDto>();
    queryParameters.setParameter(parameters);
    List<ProcessDefinitionHistoryDetailsDto> result = getQueryService().executeQuery("cockpit.kpi.selectProcessDefinitionHistoryDetails", queryParameters);

    return result;
  }

}
