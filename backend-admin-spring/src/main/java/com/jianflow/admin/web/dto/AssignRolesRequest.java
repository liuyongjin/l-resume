package com.jianflow.admin.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AssignRolesRequest(
        @NotNull List<Integer> roleIds
) {}
