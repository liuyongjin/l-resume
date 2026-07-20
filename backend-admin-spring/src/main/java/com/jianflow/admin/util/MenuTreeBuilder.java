package com.jianflow.admin.util;

import com.jianflow.admin.domain.AdminMenu;
import com.jianflow.admin.web.dto.MenuTreeDto;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class MenuTreeBuilder {

    private MenuTreeBuilder() {
    }

    public static List<MenuTreeDto> buildTree(List<AdminMenu> menus) {
        Map<Integer, MenuTreeDto> nodes = new LinkedHashMap<>();
        List<AdminMenu> sorted = menus.stream()
                .sorted(Comparator
                        .comparing(AdminMenu::getSortOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(AdminMenu::getId))
                .toList();

        for (AdminMenu menu : sorted) {
            nodes.put(menu.getId(), toDto(menu));
        }

        List<MenuTreeDto> roots = new ArrayList<>();
        for (AdminMenu menu : sorted) {
            MenuTreeDto node = nodes.get(menu.getId());
            Integer parentId = menu.getParentId();
            if (parentId == null || parentId == 0 || !nodes.containsKey(parentId)) {
                roots.add(node);
            } else {
                nodes.get(parentId).children().add(node);
            }
        }
        return roots;
    }

    private static MenuTreeDto toDto(AdminMenu menu) {
        return new MenuTreeDto(
                menu.getId(),
                menu.getParentId(),
                menu.getName(),
                menu.getType(),
                menu.getPath(),
                menu.getComponent(),
                menu.getPermission(),
                menu.getIcon(),
                menu.getSortOrder(),
                Boolean.TRUE.equals(menu.getVisible()),
                menu.getStatus(),
                new ArrayList<>()
        );
    }
}
