CREATE TABLE orders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name       VARCHAR(255)  NOT NULL,
    customer_phone      VARCHAR(30),
    delivery_address    VARCHAR(255)  NOT NULL,
    delivery_complement VARCHAR(200),
    status              VARCHAR(255)  NOT NULL,
    created_by          BIGINT        NOT NULL,
    created_at          TIMESTAMP     NOT NULL,
    updated_at          TIMESTAMP     NOT NULL,
    CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);

CREATE TABLE order_items (
    order_id   BIGINT         NOT NULL,
    name       VARCHAR(255)   NOT NULL,
    quantity   INTEGER        NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
