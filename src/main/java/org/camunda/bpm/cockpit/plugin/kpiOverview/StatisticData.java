package org.camunda.bpm.cockpit.plugin.kpiOverview;

public class StatisticData {
	private String taskId;
	private String kpi;
	private String kpiUnit;
	
	public String getTaskId() {
		return taskId;
	}
	public void setTaskId(String taskId) {
		this.taskId = taskId;
	}
	public String getKpi() {
		return kpi;
	}
	public void setKpi(String kpi) {
		this.kpi = kpi;
	}
	public String getKpiUnit() {
		return kpiUnit;
	}
	public void setKpiUnit(String kpiUnit) {
		this.kpiUnit = kpiUnit;
	}
}
