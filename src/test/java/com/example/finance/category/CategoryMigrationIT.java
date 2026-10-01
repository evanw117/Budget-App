package com.example.finance.category;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@Testcontainers
class CategoryMigrationIT {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");
    @Test void upgradesExistingUsersAndDoesNotReseedOnRestart() {
        var source = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        Flyway.configure().dataSource(source).target("1").load().migrate();
        var jdbc = new JdbcTemplate(source);
        UUID user = UUID.randomUUID();
        jdbc.update("INSERT INTO app_user(id,email,password_hash,display_name,role,created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)",
                user, "existing@example.com", "test-hash", "Existing", "ROLE_USER");
        var flyway = Flyway.configure().dataSource(source).load();
        flyway.migrate();
        assertThat(jdbc.queryForList("SELECT name FROM category WHERE user_id=? AND type='INCOME'", String.class, user))
                .containsExactlyInAnyOrderElementsOf(DefaultCategoryService.INCOME);
        assertThat(jdbc.queryForList("SELECT name FROM category WHERE user_id=? AND type='EXPENSE'", String.class, user))
                .containsExactlyInAnyOrderElementsOf(DefaultCategoryService.EXPENSE);
        jdbc.update("UPDATE category SET active=FALSE WHERE user_id=? AND name='Salary'", user);
        flyway.migrate();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM category WHERE user_id=?", Integer.class, user)).isEqualTo(16);
        assertThat(jdbc.queryForObject("SELECT active FROM category WHERE user_id=? AND name='Salary'", Boolean.class, user)).isFalse();
    }
}
