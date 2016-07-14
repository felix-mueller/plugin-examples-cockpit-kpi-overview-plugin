package org.camunda.bpm.cockpit.plugin.kpiOverview.resources;

import javax.ws.rs.Path;
import javax.ws.rs.PathParam;

import org.camunda.bpm.cockpit.plugin.kpiOverview.KPIOverviewPlugin;
import org.camunda.bpm.cockpit.plugin.resource.AbstractPluginRootResource;

@Path("plugin/" + KPIOverviewPlugin.ID)
public class KPIOverviewPluginRootResource extends AbstractPluginRootResource {

  public KPIOverviewPluginRootResource() {
    super(KPIOverviewPlugin.ID);
  }

  @Path("{engineName}/process-instance-detail/{processInstanceId}")
  public KPIProcessInstanceDetailResource getProcessInstanceResource(@PathParam("engineName") String engineName, @PathParam("processInstanceId") String processInstanceId) {
    return subResource(new KPIProcessInstanceDetailResource(engineName, processInstanceId), engineName);
  }

  @Path("{engineName}/process-definition-history/{processDefinitionId}")
  public KPIProcessDefinitionHistoryResource getProcessDefinitionHistoryResource(@PathParam("engineName") String engineName, @PathParam("processDefinitionId") String processDefinitionId) {
    return subResource(new KPIProcessDefinitionHistoryResource(engineName, processDefinitionId), engineName);
  }

}
