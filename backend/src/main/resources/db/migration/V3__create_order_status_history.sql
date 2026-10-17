CREATE TABLE order_status_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   BIGINT       NOT NULL,
    status     VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP    NOT NULL,
    CONSTRAINT fk_status_history_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE INDEX idx_status_history_order ON order_status_history (order_id);

INSERT INTO order_status_history (order_id, status, changed_at)
SELECT id, status, updated_at FROM orders;
