package com.example.finance.category;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findAllByUserIdOrderByTypeAscNameAscIdAsc(UUID userId);
    Optional<Category> findByIdAndUserId(UUID id, UUID userId);
}
