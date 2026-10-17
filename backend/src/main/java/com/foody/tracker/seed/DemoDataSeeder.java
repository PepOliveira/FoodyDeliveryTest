package com.foody.tracker.seed;

import com.foody.tracker.order.Order;
import com.foody.tracker.order.OrderItem;
import com.foody.tracker.order.OrderRepository;
import com.foody.tracker.order.OrderStatus;
import com.foody.tracker.user.User;
import com.foody.tracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.demo-email}")
    private String demoEmail;

    @Value("${app.seed.demo-password}")
    private String demoPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(demoEmail)) {
            return;
        }
        User demo = userRepository.save(new User("Demo Foody", demoEmail, passwordEncoder.encode(demoPassword)));
        Instant now = Instant.now();

        order(demo, now, "Maria Souza", "(11) 98888-0001", "Av. Paulista, 1000 - Bela Vista", "Conjunto 52",
                minutesAgo(now, 14), OrderStatus.RECEBIDO, 0,
                item("Hambúrguer artesanal", 2, "32.90"), item("Batata frita", 1, "14.00"));

        order(demo, now, "Carlos Pereira", "(11) 98888-0002", "Rua Augusta, 500 - Consolação", "Apto 42, interfone 42",
                minutesAgo(now, 9), OrderStatus.EM_PREPARO, 5,
                item("Pizza margherita", 1, "54.90"), item("Refrigerante 2L", 1, "12.00"));

        order(demo, now, "Juliana Alves", "(11) 98888-0003", "Rua Oscar Freire, 220 - Jardins", null,
                minutesAgo(now, 31), OrderStatus.SAIU_PARA_ENTREGA, 12,
                item("Combo sushi 20 peças", 1, "89.00"));

        order(demo, now, "Rafael Lima", "(21) 98888-0004", "Av. Atlântica, 1200 - Copacabana", "Bloco B, apto 301",
                minutesAgo(now, 125), OrderStatus.ENTREGUE, 0,
                item("Salada caesar", 2, "28.50"), item("Suco de laranja", 2, "9.00"));

        order(demo, now, "Beatriz Costa", "(31) 98888-0005", "Rua da Bahia, 880 - Centro", null,
                minutesAgo(now, 70), OrderStatus.CANCELADO, 0,
                item("Lasanha bolonhesa", 1, "46.00"));

        order(demo, now, "Pedro Martins", "(41) 98888-0006", "Rua XV de Novembro, 45 - Centro", "Casa dos fundos",
                minutesAgo(now, 2), OrderStatus.RECEBIDO, 0,
                item("Açaí 500ml", 2, "21.00"));

        log.info("Seeded demo user {} and sample orders", demoEmail);
    }

    private void order(User creator, Instant now, String customer, String phone, String address, String complement,
                       Instant createdAt, OrderStatus finalStatus, int minutesInKitchen, OrderItem... items) {
        Order order = new Order(customer, phone, address, complement, List.of(items), creator, createdAt);
        Instant step = createdAt.plus(Duration.ofMinutes(Math.max(minutesInKitchen, 1)));
        switch (finalStatus) {
            case EM_PREPARO -> order.changeStatus(OrderStatus.EM_PREPARO, step);
            case SAIU_PARA_ENTREGA -> {
                order.changeStatus(OrderStatus.EM_PREPARO, step);
                order.changeStatus(OrderStatus.SAIU_PARA_ENTREGA, step.plus(Duration.ofMinutes(12)));
            }
            case ENTREGUE -> {
                order.changeStatus(OrderStatus.EM_PREPARO, step.plus(Duration.ofMinutes(3)));
                order.changeStatus(OrderStatus.SAIU_PARA_ENTREGA, step.plus(Duration.ofMinutes(18)));
                order.changeStatus(OrderStatus.ENTREGUE, step.plus(Duration.ofMinutes(35)));
            }
            case CANCELADO -> order.changeStatus(OrderStatus.CANCELADO, step.plus(Duration.ofMinutes(4)));
            default -> { }
        }
        orderRepository.save(order);
    }

    private static Instant minutesAgo(Instant now, long minutes) {
        return now.minus(Duration.ofMinutes(minutes));
    }

    private static OrderItem item(String name, int quantity, String unitPrice) {
        return new OrderItem(name, quantity, new BigDecimal(unitPrice));
    }
}
