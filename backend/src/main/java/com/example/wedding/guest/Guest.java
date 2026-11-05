package com.example.wedding.guest;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guests", indexes = @Index(name = "idx_guests_name_lower", columnList = "name"))
public class Guest {
    @Id @GeneratedValue private UUID id;
    @Column(nullable = false, length = 120) private String name;
    @Column(name = "table_name", nullable = false, length = 80) private String tableName;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected Guest() {}
    public Guest(String name, String tableName) { this.name = name; this.tableName = tableName; }
    @PrePersist void beforeInsert() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void beforeUpdate() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getTableName() { return tableName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void update(String name, String tableName) { this.name = name; this.tableName = tableName; }
}
