package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateMenuRequest(
        @Size(max = 100) String name,
        @Size(max = 200) String path,
        @Size(max = 200) String component,
        @Size(max = 100) String permission,
        @Size(max = 50) String icon,
        Integer sortOrder,
        Boolean visible,
        @Pattern(regexp = "active|disabled") String status
) {}
