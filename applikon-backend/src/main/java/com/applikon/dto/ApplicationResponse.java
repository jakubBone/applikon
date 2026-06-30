package com.applikon.dto;

import com.applikon.entity.*;

import java.time.LocalDateTime;

public record ApplicationResponse(
        Long id,
        String company,
        String position,
        String link,
        Integer salary,
        Integer salaryMin,
        Integer salaryMax,
        String currency,
        SalaryType salaryType,
        ContractType contractType,
        SalarySource salarySource,
        String source,
        ApplicationStatus status,
        String jobDescription,
        String companyResearch,
        String agency,
        LocalDateTime appliedAt,
        Long cvId,
        String cvFileName,
        CVType cvType,
        String cvExternalUrl,
        String currentStage,
        RejectionReason rejectionReason,
        String rejectionDetails) {

    public static ApplicationResponse fromEntity(Application application) {
        CV cv = application.getCv();
        return new ApplicationResponse(
                application.getId(),
                application.getCompany(),
                application.getPosition(),
                application.getLink(),
                application.getSalary(),
                application.getSalaryMin(),
                application.getSalaryMax(),
                application.getCurrency(),
                application.getSalaryType(),
                application.getContractType(),
                application.getSalarySource(),
                application.getSource(),
                application.getStatus(),
                application.getJobDescription(),
                application.getCompanyResearch(),
                application.getAgency(),
                application.getAppliedAt(),
                cv != null ? cv.getId() : null,
                cv != null ? cv.getOriginalFileName() : null,
                cv != null ? cv.getType() : null,
                cv != null ? cv.getExternalUrl() : null,
                application.getCurrentStage(),
                application.getRejectionReason(),
                application.getRejectionDetails()
        );
    }
}
