package org.camunda.bpm.cockpit.plugin.kpiOverview.resources;

import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;

import org.camunda.bpm.cockpit.plugin.kpiOverview.KPIOverviewPlugin;
import org.camunda.bpm.cockpit.plugin.resource.AbstractPluginRootResource;

@Path("plugin/" + KPIOverviewPlugin.ID)
public class KPIOverviewPluginRootResource extends AbstractPluginRootResource {

  public KPIOverviewPluginRootResource() {
    super(KPIOverviewPlugin.ID);
  }

  @Path("{engineName}/history/statistic/query")
  public KPIStatisticsResource getProcessInstanceResource(@PathParam("engineName") String engineName, @QueryParam("processDefinitionId") String processDefinitionId, @QueryParam("statisticData") String statisticData) {
    return subResource(new KPIStatisticsResource(engineName, processDefinitionId, statisticData), engineName);
  }

}
