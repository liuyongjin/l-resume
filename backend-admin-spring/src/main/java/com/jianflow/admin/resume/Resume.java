package com.jianflow.admin.resume;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "jf_resume")
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "template_id", length = 50)
    private String templateId;

    @Column(length = 20)
    private String source;

    @Column(name = "is_favorite", nullable = false)
    private boolean favorite;

    @Column(name = "share_token", length = 64)
    private String shareToken;

    @Column(name = "share_expires_at")
    private Instant shareExpiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Integer getId() { return id; }
    public Integer getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getTemplateId() { return templateId; }
    public String getSource() { return source; }
    public boolean isFavorite() { return favorite; }
    public String getShareToken() { return shareToken; }
    public Instant getShareExpiresAt() { return shareExpiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
