package com.smartwashpro.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ComplaintResolutionRequest {
    @NotBlank
    private String resolution;

    public ComplaintResolutionRequest() {}

    public ComplaintResolutionRequest(String resolution) {
        this.resolution = resolution;
    }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
}
