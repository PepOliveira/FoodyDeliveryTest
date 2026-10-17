package com.foody.tracker.order;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

public final class OrderSpecifications {

    private static final List<String> PHONE_SYMBOLS = List.of("(", ")", " ", "-", "+");

    private OrderSpecifications() {
    }

    public static Specification<Order> withStatuses(Collection<OrderStatus> statuses) {
        return (root, query, cb) -> statuses == null || statuses.isEmpty()
                ? cb.conjunction()
                : root.get("status").in(statuses);
    }

    public static Specification<Order> matching(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }
            String text = search.trim().toLowerCase(Locale.ROOT);
            List<Predicate> alternatives = new ArrayList<>();

            alternatives.add(cb.like(cb.lower(root.get("customerName")), "%" + escapeLike(text) + "%", '\\'));

            String idText = text.startsWith("#") ? text.substring(1) : text;
            if (idText.matches("\\d{1,18}")) {
                alternatives.add(cb.equal(root.get("id"), Long.parseLong(idText)));
            }

            String digits = text.replaceAll("\\D", "");
            if (!digits.isEmpty()) {
                Expression<String> phone = root.get("customerPhone");
                for (String symbol : PHONE_SYMBOLS) {
                    phone = cb.function("replace", String.class, phone, cb.literal(symbol), cb.literal(""));
                }
                alternatives.add(cb.like(phone, "%" + digits + "%"));
            }
            return cb.or(alternatives.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
