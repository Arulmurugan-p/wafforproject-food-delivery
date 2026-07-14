package com.foodorder.order.service;

import com.foodorder.order.entity.WorkflowLog;
import com.foodorder.order.repository.WorkflowLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkflowLogService {

    private final WorkflowLogRepository logRepository;

    @Transactional
    public void logWorkflowStep(Long orderId, String activityName, String activityType, String status, String details) {
        WorkflowLog logEntity = WorkflowLog.builder()
                .orderId(orderId)
                .activityName(activityName)
                .activityType(activityType)
                .status(status)
                .details(details)
                .build();
        logRepository.save(logEntity);
    }
}
