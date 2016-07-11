package org.camunda.bpm.cockpit.plugin.kpiOverview.resources;

import javax.ws.rs.Path;
//import javax.ws.rs.PathParam;

import org.camunda.bpm.cockpit.plugin.kpiOverview.KPIOverviewPlugin;
import org.camunda.bpm.cockpit.plugin.resource.AbstractPluginRootResource;

@Path("plugin/" + KPIOverviewPlugin.ID)
public class KPIOverviewPluginRootResource extends AbstractPluginRootResource {

  public KPIOverviewPluginRootResource() {
    super(KPIOverviewPlugin.ID);
  }

}
