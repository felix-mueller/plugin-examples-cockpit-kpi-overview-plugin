package org.camunda.bpm.cockpit.plugin.kpiOverview.dto;

import java.util.Date;

import org.camunda.bpm.engine.rest.dto.runtime.ProcessInstanceDto;

public class ProcessInstanceDetailsDto extends ProcessInstanceDto {

	private Date startTime;
	private Date endTime;
	private String processInstanceId;
	
	public Date getStartTime() {
		return startTime;
	}
	
	public void setStartTime(Date startTime) {
		this.startTime = startTime;
	}
	
	public Date getEndTime() {
		return endTime;
	}

	public void setEndTime(Date endTime) {
		this.endTime = endTime;
	}

	public String getProcessInstanceId() {
		return processInstanceId;
	}

	public void setProcessInstanceId(String processInstanceId) {
		this.processInstanceId = processInstanceId;
	}

}
