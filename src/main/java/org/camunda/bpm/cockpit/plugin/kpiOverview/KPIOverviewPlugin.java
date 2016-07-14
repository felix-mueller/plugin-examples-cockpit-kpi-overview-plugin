package org.camunda.bpm.cockpit.plugin.kpiOverview;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.camunda.bpm.cockpit.plugin.kpiOverview.resources.KPIOverviewPluginRootResource;
import org.camunda.bpm.cockpit.plugin.spi.impl.AbstractCockpitPlugin;

public class KPIOverviewPlugin extends AbstractCockpitPlugin {

  public static final String ID = "kpi-overview-plugin";

  public String getId() {
    return ID;
  }

  @Override
  public Set<Class<?>> getResourceClasses() {
    Set<Class<?>> classes = new HashSet<Class<?>>();

    classes.add(KPIOverviewPluginRootResource.class);

    return classes;
  }
}
